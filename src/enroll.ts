import { EventType, LoadResponse, LoadResponseSchema } from './courseApi'
import browser from 'webextension-polyfill'
import type { CourseRequest } from './background'

async function onImport(event: SubmitEvent) {
    // Don't submit the form, we just to handle the callback locally
    event.preventDefault()
    console.log('Hi')
    let username = new FormData((event.submitter as HTMLInputElement).form!).get('username')
    if (username == null || typeof username !== 'string') {
        console.log('Schedule name value not set')
        return
    }
    let data: CourseRequest = {
        type: 'CourseRequestType',
        username: username
    }

    let resp = await browser.runtime.sendMessage(undefined, data)
    let loadResp = LoadResponseSchema.safeParse(resp)
    if (loadResp.success == false) {
        console.log(`Couldn't get response from webpage: ${loadResp.error}`)
        return
    }

    let body = loadResp.data
    if (body.success == false) {
        // TODO: Spin this out into its own function
        let error = document.querySelector('div.WebRegErrorMsg')
        if (error == null) {
            let footer = document.getElementById('contact-footer')
            if (footer == null) {
                console.log('Couldn\'t display error message')
                return
            }

            let parent = footer.parentElement
            if (parent == null) {
                console.log('Couldn\'t display error message')
                return
            }

            let center = document.createElement('center')

            error = document.createElement('div')
            error.className = 'WebRegErrorMsg'
            center.appendChild(error)

            parent.before(center)
        }

        error.textContent = `Error fetching schedule: ${body.error}`
    }
    else {
        for (const val of body.data) {
            // Ignore custom events, not important for class registration
            if (val.eventType == EventType.CustomEventType) {
                continue
            }

            console.log(`Class ${val.course.code} with color ${val.color}`)
        }
    }
}

export function injectEnrollMenu(call: string) {
    // TODO: This isn't really necessary, you don't need to autoclick this
    /*let studyList = document.querySelector('table.studyList') as (HTMLTableElement | null)
    if (studyList == null) {
        let showStudyList = document.querySelector('input[value="Show Study List"]') as (HTMLInputElement | null)
        if (showStudyList == null) {
            // We don't want to risk anything, so just go back
            return
        }
        // Show the study list before continuing
        showStudyList.click()
        return
    }*/

    // Create new button
    let navBar = document.querySelector('table.WebRegNavBar')
    if (navBar == null) {
        console.log('No navigation bar detected, quitting early for safety')
        return
    }

    let importForm = document.createElement('form')
    importForm.addEventListener('submit', onImport)

    let importID = document.createElement('input')
    importID.placeholder = 'Schedule Name'
    importID.type = 'text'
    importID.name = 'username'
    importForm.appendChild(importID)

    let submit = document.createElement('input')
    submit.className = 'WebRegButton'
    submit.value = 'Import from ZotCourse'
    submit.type = 'submit'
    importForm.appendChild(submit)

    navBar.after(importForm)

    // let listText = studyList.innerText
    // console.log('Study list:', listText)
}
