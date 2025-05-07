import db from "@/db/index";
import { studentTable, type Student, fieldTable, eventTable } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { sendWhatsAppMessage } from "../notifications/interakt-messaging";
import * as studentFieldService from "./student-field.service";

interface CreateStudentData extends Omit<Student, "id" | "createdAt" | "updatedAt"> {
    fields: Array<{
        fieldId: number;
        value: string;
    }>;
}

export async function createStudent(data: CreateStudentData) {
    const { fields, ...studentData } = data;

    // Create the student entry in the database
    const student = await db.insert(studentTable).values(studentData).returning();

    // Create student fields
    const studentFields = fields.map(field => ({
        studentId: student[0].id,
        fieldId: field.fieldId,
        value: field.value
    }));
    await studentFieldService.createStudentFields(studentFields);

    // Get the event to find its alert ID
    const event = await db
        .select()
        .from(eventTable)
        .where(eq(eventTable.id, studentData.eventId))
        .then(events => events[0]);

    if (!event) {
        throw new Error("Event not found");
    }

    // Get all fields for the event's alert in sequence order
    const eventFields = await db
        .select()
        .from(fieldTable)
        .where(eq(fieldTable.alertId, event.alertId))
        .orderBy(asc(fieldTable.sequence));

    // Get student fields with their values
    const studentFieldValues = await studentFieldService.findStudentFieldsByStudentId(student[0].id);

    // Create message array based on field sequence
    const messageArr = eventFields.map(field => {
        const studentField = studentFieldValues.find(sf => sf.fieldId === field.id);
        return studentField?.value || '';
    });

    // Send the WhatsApp message to the student
    if (studentData.whatsapp) {
        const { result } = await sendWhatsAppMessage(studentData.whatsapp, messageArr, "welcome");
        if (result) {
            await updateNotificationStatus(student[0].id, true);
        } else {
            await updateNotificationStatus(student[0].id, false);
        }
    }

    return student[0];
}

export async function findStudentById(id: number) {
    const result = await db.select().from(studentTable).where(eq(studentTable.id, id));
    return result[0];
}

export async function findStudentsByEventId(eventId: number) {
    return await db.select().from(studentTable).where(eq(studentTable.eventId, eventId));
}

export async function updateStudent(id: number, data: Partial<Omit<Student, "id" | "createdAt" | "updatedAt">>) {
    const result = await db
        .update(studentTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(studentTable.id, id))
        .returning();
    return result[0];
}

export async function updateNotificationStatus(id: number, success: boolean) {
    const result = await db
        .update(studentTable)
        .set({ notificationSuccess: success, updatedAt: new Date() })
        .where(eq(studentTable.id, id))
        .returning();
    return result[0];
}

export async function deleteStudent(id: number) {
    // First delete all student fields
    await studentFieldService.findStudentFieldsByStudentId(id).then(fields => {
        fields.forEach(field => studentFieldService.deleteStudentField(field.id));
    });

    // Then delete the student
    const result = await db.delete(studentTable).where(eq(studentTable.id, id)).returning();
    return result[0];
}

export async function findAllStudents() {
    return await db.select().from(studentTable);
} 