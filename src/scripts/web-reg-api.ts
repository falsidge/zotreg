import {Page, PageType} from './scrape';

export const enum GradeType {
    Letter = '1',
    Pass = '2',
}

export const enum EnrollStatus {
    Ok,
    // You already enrolled for this course so you can't re-enroll
    AlreadyEnrolled,
    // Enrolling in this course will push you over the unit cap specified
    UnitCapReached,
    // You have a missing prerequisite or corequisite or repeat restriction
    PrereqMissing,
    // The class you're trying to enroll for is full.
    ClassFull,
    // There's probably more, this isn't an exhaustive enum
    Other,
}

export class ApiClient {
    private readonly parser: DOMParser;
    // This is ONLY used in the enroll injector so it's fine that it's public and throws
    constructor(private readonly page: Page) {
    // This doesn't work for anything but the enrollment page
        if (this.page.type !== PageType.Enroll) {
            throw new Error('Page must be on the enrollment menu');
        }

        this.parser = new DOMParser();
    }

    async enroll(code: number, grade: GradeType, variableUnits: number, authCode: number): Promise<EnrollStatus> {
        const parameters = new URLSearchParams({
            mode: 'add',
            courseCode: code.toString(),
            gradeOption: grade,
            varUnits: variableUnits.toString(),
            authCode: authCode.toString(),
        });
        const returnValue = await this.fetchParse(parameters);
        if (returnValue instanceof Page) {
            return EnrollStatus.Ok;
        }

        // For now, be overly precise
        const message = returnValue.message;
        if (message.includes('This is a duplicate request.You are already enrolled in this course or are on its waitlist.')) {
            return EnrollStatus.AlreadyEnrolled;
        }

        if (message.includes('You have exceeded the unit maximum. Students with a documented need to enroll in excess units must contact their academic advisor.')) {
            return EnrollStatus.UnitCapReached;
        }

        if (message.includes('You are ineligible to enroll due to prerequisites, corequisites, or repeat restrictions. View the Schedule of Classes comments prior to contacting your academic advisor.')) {
            return EnrollStatus.PrereqMissing;
        }

        if (message.includes('This course is full. No seats are available.')) {
            return EnrollStatus.ClassFull;
        }

        // TODO: Propagate the error message
        return EnrollStatus.Other;
    }

    // Wraps WebReg's fetch API so it's easier to process
    // Since WebReg ALWAYS returns a string of HTML, just return that
    async fetch(parameters: URLSearchParams): Promise<Document> {
    // Add call key to API request
        parameters.append('call', this.page.call);
        // Add sender page
        parameters.append('page', this.page.type);

        const resp = await fetch(globalThis.location.href, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: parameters.toString(),
        });
        return this.parser.parseFromString(await resp.text(), 'text/html');
    }

    private async fetchParse(parameters: URLSearchParams): Promise<Page | Error> {
        const html = await this.fetch(parameters);

        // TODO: This is a pretty slow process (for 3 classes, I had variance between 304 to 740 ms)
        // Use some cleverer technique to make this faster! I think this delay is maybe somewhat noticeable for users
        const page = new Page(html);
        if (page.error === null) {
            return page;
        }

        return new Error(page.error ?? '');
    }
}
