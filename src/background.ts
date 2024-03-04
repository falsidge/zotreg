import browser from 'webextension-polyfill'
import { Schema, z } from 'zod'
import { LoadResponse, LoadResponseSchema } from './courseApi'

console.log('Hi from background script')

enum RequestType {
    CourseRequestType
}
const RequestTypeSchema = z.nativeEnum(RequestType)

const RequestSchema = z.object({
    type: RequestTypeSchema
})
export type Request = z.infer<typeof RequestSchema>

const CourseRequestSchema = z.object({
    type: z.literal(RequestType.CourseRequestType),
    username: z.string()
})
export type CourseRequest = z.infer<typeof CourseRequestSchema>

export async function sendCourseRequest(username: string): Promise<LoadResponse | null> {
    return sendRequest({ type: RequestType.CourseRequestType, username }, LoadResponseSchema)
}

async function sendRequest<R extends Request, S extends Schema, T>(request: R, schema: S): Promise<T | null> {
    let resp = await browser.runtime.sendMessage(undefined, request)
    let parsed = schema.safeParse(resp)
    if (parsed.success == false) {
        return null
    }
    else {
        return parsed.data
    }
}

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
