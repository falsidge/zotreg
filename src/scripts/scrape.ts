import { z } from 'zod'

export enum PageType {
    Main = 'enrollQtrMenu',
    Enroll = 'enrollmentMenu',
    Waitlist = 'waitlistMenu'
}
const PageSchema = z.nativeEnum(PageType)

export class Page {
    type: PageType
    error: string | null
    call: string

    // Scrapes the document provided
    constructor(doc: Document) {
        // This shows the page in code, so it's probably more reliable than the title
        let page = doc.querySelector('form input[name=page]') as (HTMLInputElement | null)
        if (page == null) {
            throw new Error(`WebReg page doesn't seem to have a page identifier (no form element with name="page" input)`)
        }

        let error = doc.querySelector('div.WebRegErrorMsg') as (HTMLDivElement | null)
        this.error = error ? error.textContent : null

        // I THINK this is an API key type thing. Not sure though
        // Changes when login authentication expires
        let call = document.querySelector('form input[name=call]') as (HTMLInputElement | null)
        if (call == null) {
            throw new Error(`Couldn't get call key from WebReg (no form element with name="call" input)`)
        }
        this.call = call.value

        let parsed = PageSchema.safeParse(page.value)
        if (parsed.success == false) {
            throw new Error(`Tried to parse invalid page: (page is ${page.value}, zod error is ${parsed.error})`)
        }

        this.type = parsed.data
    }
}
