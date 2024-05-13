import { CourseData, CourseMeta, EventType, Schedule } from './courseApi'
import { sendCourseRequest } from './background'
import { APIClient } from './webRegApi'
import { Page } from './scrape'

export class EnrollInjector {
    private api: APIClient
    private username: HTMLInputElement
    private errorDiv: HTMLDivElement

    // Get the WebRegErrorMsg div (or return a hidden one if not already created)


    // This throws, so we don't want to expose the API like that
    private constructor(page: Page) {
        this.api = new APIClient(page)
        // Create new button
        let navBar = document.querySelector('table.WebRegNavBar')
        if (navBar == null) {
            throw new Error('No navigation bar detected, quitting early for safety')
        }

        let inputForm = document.createElement('form')
        inputForm.addEventListener('submit', this.onImport.bind(this))

        this.username = document.createElement('input')
        this.username.placeholder = 'Schedule Name'
        this.username.type = 'text'
        this.username.name = 'username'
        inputForm.appendChild(this.username)

        let submit = document.createElement('input')
        submit.className = 'WebRegButton'
        submit.value = 'Import from ZotCourse'
        submit.type = 'submit'
        inputForm.appendChild(submit)

        navBar.after(inputForm)

        const getErrorDiv = (): HTMLDivElement => {
            let errorDiv = document.querySelector('div.WebRegErrorMsg') as (HTMLDivElement | null)
            if (errorDiv) {
                return errorDiv
            }

            let footer = document.getElementById('contact-footer')
            if (footer == null) {
                throw new Error(`Couldn't get content-footer element`)
            }

            let parent = footer.parentElement
            if (parent == null) {
                throw new Error(`Couldn't get parent of content-footer element`)
            }

            let center = document.createElement('center')

            let newErrorDiv = document.createElement('div')
            newErrorDiv.className = 'WebRegErrorMsg'
            center.appendChild(newErrorDiv)
            newErrorDiv.hidden = true

            parent.before(center)
            return newErrorDiv
        }
        this.errorDiv = getErrorDiv()
    }

    static newInjector(page: Page): EnrollInjector | Error {
        try {
            return new EnrollInjector(page)
        }
        catch (e) {
            if (e instanceof Error) {
                return e
            }
            // TODO: This should NEVER happen and should be handled as programmer error
            return new Error(`Non-error thrown: ${e}`)
        }
    }

    private showError(message: string) {
        this.errorDiv.hidden = false
        // TODO: This might be unsafe if input is unsanitized... but also all errors are straight from WebReg and ZotCourse.
        this.errorDiv.innerHTML = message
    }

    private hideError() {
        this.errorDiv.hidden = true
    }

    // Get a requested schedule.
    // Sets error message before returning.
    private async getSchedule(username: string): Promise<Schedule | null> {
        let errPrefix = 'Error fetching schedule: '
        let resp = await sendCourseRequest(username)
        if (resp == null) {
            this.showError(errPrefix + `Couldn't fetch schedule from page`)
            return null
        }

        if (resp.success == false) {
            this.showError(errPrefix + resp.error)
            return null
        }
        else {
            this.hideError()
            return resp.data
        }
    }

    private async enroll(course: string) {
        let doc = await this.api.fetch(new URLSearchParams({
            mode: 'add',
            courseCode: course,
            // TODO: All this is hardcoded atm which is bad
            gradeOption: '1',
            varUnits: '',
            authCode: ''
        }))
        let studyList = doc.querySelector('table.studyList') as (HTMLTableElement | null)
        if (studyList == null) {
            throw new Error('Somehow there is no study list on this page')
        }
        console.log(studyList.textContent)
    }

    private async tryEnrollAll(courses: CourseData[]) {
        let results = await Promise.all(courses.map(async (course): Promise<string | null> => {
            try {
                // We need to await because I don't want to spam WebReg so hard
                // It doesn't handle that very well and I think it'll end up with a 'in use' error
                await this.enroll(course.code)
                console.log(`Enrolled for class ${course.code} successfully`)
                return null
            }
            catch (e) {
                // TODO: This is probably a real stupid way of doing this, don't use throw exceptions
                if (e instanceof Error) {
                    // TODO: The proper way to do this is probably just to check if the page returned has form inputs
                    // If you get logged out in any way you stop having access to buttons since they don't want unauthorized users messing with stuff
                    if (e.message.includes('Login Authorization') || e.message.includes('Sorry, your student record is currently in use.')) {
                        console.log(`Login authorization failed, aborting to save API calls`)
                        // TODO: Actually handle this
                        return e.message
                    }
                    else {
                        console.log(`Couldn't register for course (error ${e.message})`)
                        return e.message
                    }
                }
                else {
                    console.log(`How the hell did we get a non-Error error: ${e}`)
                    return null
                }
            }
        }))
        let errors = results.filter<string>((error): error is string => error != null)

        if (errors.length != 0) {
            // TODO: Don't do ugly HTML? Not sure if this is avoidable at all
            this.showError('Auto-registration failed with the following errors: <br>' + errors.join('<br><br>'))
        }
    }

    private async onImport(event: SubmitEvent) {
        // Don't submit the form, we handle the callback locally
        event.preventDefault()

        // Hide the error initially for responsiveness
        this.hideError()

        let schedule = await this.getSchedule(this.username.value)
        if (schedule == null) {
            return
        }

        this.tryEnrollAll(schedule
            .filter<CourseMeta>((event): event is CourseMeta => event.eventType == EventType.Course2)
            .map(course => course.course))
    }
}
