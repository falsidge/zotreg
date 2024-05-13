// Interfaces with ZotCourse API
// https://github.com/jogplus/zotcourse/blob/master/zotcourse/models/schedule.py
import z from 'zod'

// I don't really care about ANY of the values except for the course ID
export const CourseDataSchema = z.object({
    code: z.string()
})
export type CourseData = z.infer<typeof CourseDataSchema>

export enum EventType {
    // This seems to be unused in the modern version of ZotCourse
    Course,
    Custom,
    Antplanner,
    Course2
}
export const EventTypeSchema = z.nativeEnum(EventType)

export const CourseMetaSchema = z.object({
    eventType: z.literal(EventType.Course2),
    color: z.string(),
    course: CourseDataSchema
})
export type CourseMeta = z.infer<typeof CourseMetaSchema>

// I don't really care to parse these so this is fine
export const CustomEventSchema = z.object({
    eventType: z.literal(EventType.Custom)
})
export type CustomEvent = z.infer<typeof CustomEventSchema>

export const ScheduleSchema = z.array(z.discriminatedUnion('eventType', [
    CourseMetaSchema,
    CustomEventSchema
]))
export type Schedule = z.infer<typeof ScheduleSchema>

export const LoadResponseSchema = z.discriminatedUnion('success', [
    z.object({ success: z.literal(true), data: ScheduleSchema }),
    z.object({ success: z.literal(false), error: z.string() })
])
export type LoadResponse = z.infer<typeof LoadResponseSchema>
