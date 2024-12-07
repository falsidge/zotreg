import {z} from 'zod';

export enum PageType {
    Main = 'enrollQtrMenu',
    Enroll = 'enrollmentMenu',
    Waitlist = 'waitlistMenu',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const PageSchema = z.nativeEnum(PageType);

export class Page {
    type: PageType;
    error: string | undefined;
    call: string;

    // Scrapes the document provided
    constructor(document_: Document) {
    // This shows the page in code, so it's probably more reliable than the title
        const page: HTMLInputElement = document_.querySelector('form input[name=page]')!;
        if (page === null) {
            throw new Error('WebReg page doesn\'t seem to have a page identifier (no form element with name="page" input)');
        }

        const error = document_.querySelector('div.WebRegErrorMsg');
        this.error = error?.textContent ?? '';

        // I THINK this is an API key type thing. Not sure though
        // Changes when login authentication expires
        const call: HTMLInputElement = document_.querySelector('form input[name=call]')!;
        if (call === null) {
            throw new Error('Couldn\'t get call key from WebReg (no form element with name="call" input)');
        }

        this.call = call.value;

        const parsed = PageSchema.safeParse(page.value);
        if (!parsed.success) {
            throw new Error(`Tried to parse invalid page: (page is ${page.value}, zod error is ${parsed.error.message})`);
        }

        this.type = parsed.data;
    }
}
