function onImport(event: SubmitEvent) {
    // Don't submit the form, we just to handle the callback locally
    event.preventDefault()
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
    let navBar = document.querySelector('table.WebRegNavBar td.horzButtons')
    if (navBar == null) {
        console.log('No navigation bar detected, quitting early for safety')
        return
    }

    let importBtn = document.createElement('input')
    importBtn.className = 'WebRegButton'
    importBtn.value = 'Import from ZotCourse'
    importBtn.type = 'submit'
    let newForm = document.createElement('form')
    newForm.appendChild(importBtn)
    newForm.addEventListener('submit', onImport)
    navBar.appendChild(newForm)

    // let listText = studyList.innerText
    // console.log('Study list:', listText)
}
