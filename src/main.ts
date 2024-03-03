function onViewSchedule(event: SubmitEvent) {
    // Don't want to actually submit any data
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
    title.className = 'WebRegSubtitle'
    title.innerText = 'ZotReg'

    let form = document.createElement('form')
    form.addEventListener('submit', onViewSchedule)

    let btn = document.createElement('input')
    btn.className = 'WebRegButton'
    btn.type = 'submit'
    btn.value = 'View Schedule'
    form.appendChild(btn)

    let caption = document.createElement('span')
    caption.className = 'WebRegButtonInfo'
    caption.innerText = 'Display the classes you want to register for.'
    form.appendChild(caption)

    // Add subtitle and form / button
    menu.appendChild(title)
    menu.appendChild(form)
}
