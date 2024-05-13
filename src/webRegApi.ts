import { Page, PageType } from './scrape'

export const enum GradeType {
    Letter = '1',
    Pass = '2'
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
    Other
}

export class APIClient {
    private parser: DOMParser
    // This is ONLY used in the enroll injector so it's fine that it's public and throws
    constructor(private page: Page) {
        // This doesn't work for anything but the enrollment page
        if (this.page.type != PageType.Enroll) {
            throw new Error('Page must be on the enrollment menu')
        }
        this.parser = new DOMParser()
    }

    // Wraps WebReg's fetch API so it's easier to process
    // Since WebReg ALWAYS returns a string of HTML, just return that
    private async fetch(params: URLSearchParams): Promise<string> {
        // Add call key to API request
        params.append('call', this.page.call)
        // Add sender page
        params.append('page', this.page.type)

        let resp = await fetch(window.location.href, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        })
        return await resp.text()
    }

    private async fetchParse(params: URLSearchParams): Promise<Document | Error> {
        let html = await this.fetch(params)

        // TODO: This is a pretty slow process (for 3 classes, I had variance between 304 to 740 ms)
        // Use some cleverer technique to make this faster! I think this delay is maybe somewhat noticeable for users
        let doc = this.parser.parseFromString(html, 'text/html')
        let page = new Page(doc)
        if (page.error == null) {
            return page
        }
        else {
            return new Error(error.textContent ?? "")
        }
    }

    async enroll(code: number, grade: GradeType, varUnits: number, authCode: number): Promise<EnrollStatus> {
        let params = new URLSearchParams({
            mode: 'add',
            courseCode: code.toString(),
            gradeOption: grade,
            varUnits: varUnits.toString(),
            authCode: authCode.toString()
        })
        let ret = await this.fetchParse(params)
        if (ret instanceof Document) {
            return EnrollStatus.Ok
        }
        else {
            // For now, be overly precise
            let msg = ret.message
            if (msg.includes('This is a duplicate request.You are already enrolled in this course or are on its waitlist.')) {
                return EnrollStatus.AlreadyEnrolled
            }
            else if (msg.includes('You have exceeded the unit maximum. Students with a documented need to enroll in excess units must contact their academic advisor.')) {
                return EnrollStatus.UnitCapReached
            }
            else if (msg.includes('You are ineligible to enroll due to prerequisites, corequisites, or repeat restrictions. View the Schedule of Classes comments prior to contacting your academic advisor.')) {
                return EnrollStatus.PrereqMissing
            }
            else if (msg.includes('This course is full. No seats are available.')) {
                return EnrollStatus.ClassFull
            }
            else {
                // TODO: Propagate the error message
                return EnrollStatus.Other
            }
        }
    }
}
