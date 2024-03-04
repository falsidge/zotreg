export class Client {
    page: string
    call: string

    constructor(page: string, call: string) {
        this.page = page
        this.call = call
    }

    // Wraps WebReg's fetch API so it's easier to process
    async fetch(params: URLSearchParams): Promise<Document> {
        // Add call key to API request
        params.append('call', this.call)
        // Add sender page
        params.append('page', this.page)

        let resp = await fetch(window.location.href, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        })

        let html = await resp.text()

        let doc = new DOMParser().parseFromString(html, 'text/html')
        let error = doc.querySelector('div.WebRegErrorMsg')
        if (error == null) {
            return doc
        }
        else {
            throw new Error(error.textContent ?? "")
        }
    }
}
