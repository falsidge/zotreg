import { EnrollInjector } from './enroll'
import { Client } from './webRegApi'

function inject(title: string, call: string) {
    console.log(`Detected page as ${title}`)
    // From what I can tell, there are only 3 real pages
    const client = new Client(title, call)
    switch (title) {
        case 'enrollQtrMenu':
            // Not planning to do anything with this menu atm
            break
        case 'enrollmentMenu':
            new EnrollInjector(client)
            break
        case 'waitlistMenu':
            // Not planning to do anything with this menu atm
            // injectWaitlistMenu()
            break
    }
}

function tryInject() {
    console.log('Attempting to inject ZotReg script')

    if (!window.location.href.includes('/cgi-bin/wramia')) {
        console.log('URL doesn\'t seem to be in WebReg, ignoring')
        return
    }

    // This shows the page in code, so it's probably more reliable than the title
    let page = document.querySelector('form input[name=page]') as (HTMLInputElement | null)
    if (page == null) {
        console.log('WebReg page doesn\'t seem to have a page identifier, ignoring')
        return
    }

    // Kind of a 'watermark' since this appears on every page (seemingly)
    // This is user-facing so probably less reliable than the page identifier in the forms
    /*
    let title = document.querySelector('h1.WebRegTitle') as (HTMLHeadingElement | null)
    if (title == null) {
        console.log('WebReg page doesn\'t seem to have a WebRegTitle element, ignoring')
        return
    }
    */

    // I THINK this is an API key type thing. Not sure though
    // Changes when login authentication expires
    let call = document.querySelector('form input[name=call]') as (HTMLInputElement | null)
    if (call == null) {
        console.log('Couldn\'t get call key from WebReg, ignoring')
        return
    }

    inject(page.value, call.value)
}

tryInject()
