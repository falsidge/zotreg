import { EnrollInjector } from './enroll'
import { Page, PageType } from './scrape'

function inject(page: Page) {
    switch (page.type) {
        case PageType.Enroll:
            new EnrollInjector(page)
            break
        case PageType.Main:
        case PageType.Waitlist:
            console.log(`Page doesn't have anything to inject, ignoring`)
            // Not planning to do anything with these atm
            break
    }
}

function tryInject() {
    console.log('Attempting to inject ZotReg script')

    try {
        inject(new Page(document))
    }
    catch (e) {
        console.log(`Couldn't scrape page (error is ${e}), ignoring`)
    }
}

tryInject()
