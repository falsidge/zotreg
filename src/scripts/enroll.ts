
import {
    type CourseData, type CourseMeta, EventType, type Schedule,
} from './course-api';
import {sendCourseRequest} from './background';
import {ApiClient} from './web-reg-api';
import {type Page} from './scrape';

export class EnrollInjector {
    static newInjector(page: Page): EnrollInjector | Error {
        try {
            return new EnrollInjector(page);
        } catch (error) {
            if (error instanceof Error) {
                return error;
            }

            // TODO: This should NEVER happen and should be handled as programmer error
            return new Error('Non-error thrown');
        }
    }

    public api: ApiClient;
    private readonly username: HTMLInputElement;
    private readonly errorDiv: HTMLDivElement;

    // Get the WebRegErrorMsg div (or return a hidden one if not already created)
    // This throws, so we don't want to expose the API like that
    constructor(page: Page) {
        this.api = new ApiClient(page);
        // Create new button
        const navigationBar = document.querySelector('table.WebRegNavBar');
        if (navigationBar === null) {
            throw new Error('No navigation bar detected, quitting early for safety');
        }

        const inputForm = document.createElement('form');
        inputForm.addEventListener('submit', this.onImport.bind(this));

        this.username = document.createElement('input');
        this.username.placeholder = 'Schedule Name';
        this.username.type = 'text';
        this.username.name = 'username';
        inputForm.append(this.username);

        const submit = document.createElement('input');
        submit.className = 'WebRegButton';
        submit.value = 'Import from ZotCourse';
        submit.type = 'submit';
        inputForm.append(submit);

        navigationBar.after(inputForm);

        const getErrorDiv = (): HTMLDivElement => {
            const errorDiv: HTMLDivElement | undefined = document.querySelector('div.WebRegErrorMsg') as HTMLDivElement | undefined;
            if (errorDiv !== null && errorDiv !== undefined) {
                return errorDiv;
            }

            const footer = document.querySelector('#contact-footer');
            if (footer === null) {
                throw new Error('Couldn\'t get content-footer element');
            }

            const parent = footer.parentElement;
            if (parent === null) {
                throw new Error('Couldn\'t get parent of content-footer element');
            }

            const center = document.createElement('div');

            const newErrorDiv = document.createElement('div');
            newErrorDiv.className = 'WebRegErrorMsg';
            center.append(newErrorDiv);
            newErrorDiv.hidden = true;

            parent.before(center);
            return newErrorDiv;
        };

        this.errorDiv = getErrorDiv();
    }

    private showError(message: string) {
        this.errorDiv.hidden = false;
        // TODO: This might be unsafe if input is unsanitized... but also all errors are straight from WebReg and ZotCourse.
        this.errorDiv.innerHTML = message;
    }

    private hideError() {
        this.errorDiv.hidden = true;
    }

    // Get a requested schedule.
    // Sets error message before returning.
    private async getSchedule(username: string): Promise<Schedule | undefined> {
        const errorPrefix = 'Error fetching schedule: ';
        const resp = await sendCourseRequest(username);
        if (resp === null) {
            this.showError(errorPrefix + 'Couldn\'t fetch schedule from page');
            return;
        }

        if (!resp!.success) {
            this.showError(errorPrefix + resp!.error);
            return;
        }

        this.hideError();
        return resp!.data;
    }

    private async enroll(course: string) {
        const document_ = await this.api.fetch(new URLSearchParams({
            mode: 'add',
            courseCode: course,
            // TODO: All this is hardcoded atm which is bad
            gradeOption: '1',
            varUnits: '',
            authCode: '',
        }));
        const studyList = document_.querySelector('table.studyList');
        if (studyList === null) {
            throw new Error('Somehow there is no study list on this page');
        }

        console.log(studyList.textContent);
    }

    private async tryEnrollAll(courses: CourseData[]) {
        const results = await Promise.all(courses.map(async (course): Promise<string | undefined> => {
            try {
                // We need to await because I don't want to spam WebReg so hard
                // It doesn't handle that very well and I think it'll end up with a 'in use' error
                await this.enroll(course.code);
                console.log(`Enrolled for class ${course.code} successfully`);
            } catch (error) {
                // TODO: This is probably a real stupid way of doing this, don't use throw exceptions
                if (error instanceof Error) {
                    // TODO: The proper way to do this is probably just to check if the page returned has form inputs
                    // If you get logged out in any way you stop having access to buttons since they don't want unauthorized users messing with stuff
                    if (error.message.includes('Login Authorization') || error.message.includes('Sorry, your student record is currently in use.')) {
                        console.log('Login authorization failed, aborting to save API calls');
                        // TODO: Actually handle this
                        return error.message;
                    }

                    console.log(`Couldn't register for course (error ${error.message})`);
                    return error.message;
                }

                console.log(`How the hell did we get a non-Error error: ${error as string}`);
            }
        }));
        const errors = results.filter<string>((error): error is string => error !== null);

        if (errors.length > 0) {
            // TODO: Don't do ugly HTML? Not sure if this is avoidable at all
            this.showError('Auto-registration failed with the following errors: <br>' + errors.join('<br><br>'));
        }
    }

    private async onImport(event: SubmitEvent) {
    // Don't submit the form, we handle the callback locally
        event.preventDefault();

        // Hide the error initially for responsiveness
        this.hideError();

        const schedule = await this.getSchedule(this.username.value);
        if (schedule === null || schedule === undefined) {
            return;
        }

        await this.tryEnrollAll(schedule
            .filter<CourseMeta>((event): event is CourseMeta => event.eventType === EventType.Course2)
            .map(course => course.course));
    }
}
