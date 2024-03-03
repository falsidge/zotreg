enum GradeOption {
    Letter = 1,
    Pass = 2
}

class Course {
    req: CourseRequest
    dept: string
    num: string

    constructor(line: string) {

    }
}

class CourseRequest {
    courseCode: number
    gradeOption: GradeOption
    varUnits: number | ""
    authCode: string

    constructor(courseCode: number,
        gradeOption: GradeOption = GradeOption.Letter,
        varUnits: number | null,
        authCode: string = "") {
        this.courseCode = courseCode
        this.gradeOption = gradeOption
        this.varUnits = (varUnits ?? "")
        this.authCode = authCode
    }
}
