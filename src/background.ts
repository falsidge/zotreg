import browser from 'webextension-polyfill';
import {type Schema, z} from 'zod';
import {type LoadResponse, LoadResponseSchema} from './courseApi';

enum RequestType {
    CourseRequestType,
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const RequestTypeSchema = z.nativeEnum(RequestType);

// eslint-disable-next-line @typescript-eslint/naming-convention
const RequestSchema = z.object({
    type: RequestTypeSchema,
});

export type Request = z.infer<typeof RequestSchema>;

// eslint-disable-next-line @typescript-eslint/naming-convention
const CourseRequestSchema = z.object({
    type: z.literal(RequestType.CourseRequestType),
    username: z.string(),
});

export type CourseRequest = z.infer<typeof CourseRequestSchema>;

// Send a course request
export async function sendCourseRequest(username: string): Promise<LoadResponse | undefined> {
    return sendRequest({type: RequestType.CourseRequestType, username}, LoadResponseSchema);
}

// This is meant to be called from the content script to send a message to the background script
async function sendRequest<R extends Request, S extends Schema, T>(request: R, schema: S): Promise<T | undefined> {
    const resp: unknown = await browser.runtime.sendMessage(undefined, request);
    const parsed = schema.safeParse(resp);
    if (!parsed.success) {
        return;
    }

    return parsed.data as T;
}

browser.runtime.onMessage.addListener(
    (message, sender, sendResponse): undefined | true => {
        const parsed = CourseRequestSchema.safeParse(message);
        if (!parsed.success) {
            // Message doesn't fit shape
            return;
        }

        const request = parsed.data;

        // TODO: Type package has wrong signature for sendResponse
        // https://github.com/Lusito/webextension-polyfill-ts/pull/96#issuecomment-1881740410
        // TODO: Chrome doesn't support returning promises
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1185241
        const respond = sendResponse as (resp: any) => void;

        fetch('https://zotcourse.appspot.com/schedule/load?' + new URLSearchParams({username: request.username}).toString())
            .then(async resp => resp.json())
            .then(resp => {
                respond(resp);
            })
            .catch(() => {
                respond(null);
            });

        return true;
    },
);
