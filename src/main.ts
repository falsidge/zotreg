function onViewSchedule(event: SubmitEvent) {
    event.preventDefault()
    console.log('Button clicked Lol')
}

export function injectMainMenu(call: string) {
    let menu = document.querySelector('td.vertButtons') as (HTMLTableCellElement | null)
    if (menu == null) {
        console.log('Couldn\'t find main button menu on main page, exiting')
        return
    }

    // New stuff to add to the main page
    let title = document.createElement('h2')
    title.innerText = 'ZotReg'
    title.className = 'WebRegSubtitle'
    let form = document.createElement('form')
    let btn = document.createElement('input')
    btn.className = 'WebRegButton'
    btn.value = 'View Schedule'
    btn.type = 'submit'
    form.addEventListener('submit', onViewSchedule)
    form.appendChild(btn)

    // Add subtitle and form / button
    menu.appendChild(title)
    menu.appendChild(form)
}
