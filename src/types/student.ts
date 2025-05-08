import { Student, StudentField } from "@/db/schema";

export interface StudentType extends Student {
    fields: StudentField[];
}