import browser from 'webextension-polyfill'
import { z } from 'zod'

console.log('Hi from background script')

const RequestTypeSchema = z.enum(['CourseRequestType'])
export type RequestType = z.infer<typeof RequestTypeSchema>

const RequestSchema = z.object({
    type: RequestTypeSchema
})
export type Request = z.infer<typeof RequestSchema>

const CourseRequestSchema = RequestSchema.extend({
    username: z.string()
})
export type CourseRequest = z.infer<typeof CourseRequestSchema>
export const CourseResponseSchema = z.object({})

browser.runtime.onMessage.addListener(
    (msg, sender, sendResponse) => {
        let parsed = CourseRequestSchema.safeParse(msg)
        if (parsed.success == false) {
            // Message doesn't fit shape
            return
        }
        let req = parsed.data

        // TODO: Type package has wrong signature for sendResponse
        // https://github.com/Lusito/webextension-polyfill-ts/pull/96#issuecomment-1881740410
        // TODO: Chrome doesn't support returning promises
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1185241
        let respond = sendResponse as (resp: any) => void

        fetch('https://zotcourse.appspot.com/schedule/load?' + new URLSearchParams({ username: req.username }))
            .then(resp => resp.json())
            .then(resp => respond(resp))
            .catch(err => respond(null))

        return true
    }
)
