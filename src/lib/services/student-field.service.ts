import db from "@/db/index";
import { studentFieldTable, type StudentField } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createStudentField(data: Omit<StudentField, "id" | "createdAt" | "updatedAt">) {
    const result = await db.insert(studentFieldTable).values(data).returning();
    return result[0];
}

export async function createStudentFields(fields: Omit<StudentField, "id" | "createdAt" | "updatedAt">[]) {
    const result = await db.insert(studentFieldTable).values(fields).returning();
    return result;
}

export async function findStudentFieldById(id: number) {
    const result = await db.select().from(studentFieldTable).where(eq(studentFieldTable.id, id));
    return result[0];
}

export async function findStudentFieldsByStudentId(studentId: number) {
    return await db.select().from(studentFieldTable).where(eq(studentFieldTable.studentId, studentId));
}

export async function findStudentFieldsByFieldId(fieldId: number) {
    return await db.select().from(studentFieldTable).where(eq(studentFieldTable.fieldId, fieldId));
}

export async function updateStudentField(id: number, data: Partial<Omit<StudentField, "id" | "createdAt" | "updatedAt">>) {
    const result = await db
        .update(studentFieldTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(studentFieldTable.id, id))
        .returning();
    return result[0];
}

export async function deleteStudentField(id: number) {
    const result = await db.delete(studentFieldTable).where(eq(studentFieldTable.id, id)).returning();
    return result[0];
}

export async function findAllStudentFields() {
    return await db.select().from(studentFieldTable);
} 