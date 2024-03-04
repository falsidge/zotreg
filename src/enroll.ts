import { EventType, LoadResponse, LoadResponseSchema } from './courseApi'
import browser from 'webextension-polyfill'
import { CourseRequest, RequestType } from './background'
import { Client } from './webRegApi'

async function enroll(api: Client, course: string) {
    let doc = await api.fetch(new URLSearchParams({
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

// Get the WebRegErrorMsg div (or return a hidden one if not already created)
function getErrorDiv(): HTMLDivElement {
    let error = document.querySelector('div.WebRegErrorMsg') as (HTMLDivElement | null)
    if (error) {
        return error
    }

    let footer = document.getElementById('contact-footer')
    if (footer == null) {
        throw new Error(`Couldn't get content-footer element`)
    }

    let parent = footer.parentElement
    if (parent == null) {
        throw new Error(`Couldn't get parent of content-footer element`)
    }

    // @ts-ignore: This is for the sake of consistency with the original page
    let center = document.createElement('center')

    let div = document.createElement('div')
    div.className = 'WebRegErrorMsg'
    center.appendChild(div)
    div.hidden = true

    parent.before(center)
    return div
}

async function onImport(api: Client, event: SubmitEvent) {
    // Don't submit the form, we just to handle the callback locally
    event.preventDefault()
    let username = new FormData((event.submitter as HTMLInputElement).form!).get('username')
    if (username == null || typeof username !== 'string') {
        console.log('Schedule name value not set')
        return
    }
    let data: CourseRequest = {
        type: RequestType.CourseRequestType,
        username: username
    }

    let resp = await browser.runtime.sendMessage(undefined, data)
    let loadResp = LoadResponseSchema.safeParse(resp)
    if (loadResp.success == false) {
        console.log(`Couldn't get response from webpage: ${loadResp.error}`)
        return
    }

    let body = loadResp.data
    let error = getErrorDiv()
    if (body.success == false) {
        error.hidden = false
        error.textContent = `Error fetching schedule: ${body.error}`
    }
    else {
        // Feedback for success if we previously had an error
        error.hidden = true
        let errorList: string[] = []
        for (const val of body.data) {
            if (val.eventType != EventType.Course2EventType) {
                continue
            }

            try {
                // We need to await because I don't want to spam WebReg so hard
                // It doesn't handle that very well and I think it'll end up with a 'in use' error
                await enroll(api, val.course.code)
                console.log(`Enrolled for class ${val.course.code} successfully`)
            }
            catch (e) {
                // TODO: This is probably a real stupid way of doing this, don't use throw exceptions
                if (e instanceof Error) {
                    // TODO: The proper way to do this is probably just to check if the page returned has form inputs
                    // If you get logged out in any way you stop having access to buttons since they don't want unauthorized users messing with stuff
                    if (e.message.includes('Login Authorization') || e.message.includes('Sorry, your student record is currently in use.')) {
                        console.log(`Login authorization failed, aborting to save API calls`)
                        // TODO: Actually handle this
                        return
                    }
                    else {
                        errorList.push(e.message)
                        console.log(`Couldn't register for course (error ${e.message})`)
                    }
                }
                else {
                    console.log(`How the hell did we get a non-Error error: ${e}`)
                }
            }
        }

        if (errorList.length != 0) {
            error.hidden = false
            error.innerHTML = 'Auto-registration failed with the following errors:<br>' + errorList.join('<br><br>')
        }
    }
}

export function injectEnrollMenu(api: Client) {
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
    // TODO: Don't do this bullshit and just make this file a class instance
    importForm.addEventListener('submit', onImport.bind(undefined, api))

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
