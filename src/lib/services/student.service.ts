import db from "@/db/index";
import { studentTable, type Student, fieldTable, eventTable, alertTable } from "@/db/schema";
import { eq, asc, inArray, and } from "drizzle-orm";
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
    let [student] = await db.insert(studentTable).values(studentData).returning();

    // Create student fields
    const studentFields = fields.map(field => ({
        studentId: student.id,
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

    const alert = await db
        .select()
        .from(alertTable)
        .where(eq(alertTable.id, event.alertId)).then(alerts => alerts[0]);

    // Get all fields for the event's alert in sequence order
    const eventFields = await db
        .select()
        .from(fieldTable)
        .where(
            and(
                eq(fieldTable.alertId, event.alertId),
                eq(fieldTable.flag, true),
            )
        )
        .orderBy(asc(fieldTable.sequence));

    // Get student fields with their values
    const studentFieldValues = await studentFieldService.findStudentFieldsByStudentId(student.id);

    // Create message array based on field sequence
    const messageArr = eventFields.map(field => {
        const studentField = studentFieldValues.find(sf => sf.fieldId === field.id);
        return studentField?.value || '';
    });

    // Send the WhatsApp message to the student

    const { result } = await sendWhatsAppMessage(studentData.whatsapp, messageArr, alert.template as string);
    if (result) {
        console.log("wa sent", result);
        student = await updateNotificationStatus(student.id, true);
    } else {
        console.log("wa not sent", result);
        student = await updateNotificationStatus(student.id, false);
    }




    return {
        ...student,
        fields: studentFieldValues,
        notificationSuccess: student.notificationSuccess,
    };
}

export async function findStudentById(id: number) {
    const result = await db.select().from(studentTable).where(eq(studentTable.id, id));
    const formattedStudent = await formatStudent(result[0]);
    return formattedStudent;
}

export async function findStudentsByEventId(eventId: number) {
    const result = await db.select().from(studentTable).where(eq(studentTable.eventId, eventId));
    const formattedStudents = await Promise.all(result.map(async (student) => await formatStudent(student)));

    console.log("formattedStudents:", formattedStudents);

    return formattedStudents;
}

export async function updateStudent(id: number, data: Partial<Omit<Student, "id" | "createdAt" | "updatedAt">>) {
    const result = await db
        .update(studentTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(studentTable.id, id))
        .returning();
    const formattedStudent = await formatStudent(result[0]);
    return formattedStudent;
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
    const formattedStudent = await formatStudent(result[0]);
    return formattedStudent;
}

export async function findAllStudents() {
    const result = await db.select().from(studentTable);
    const formattedStudents = await Promise.all(result.map(async (student) => await formatStudent(student)));
    return formattedStudents;
}

export async function findStudentsByFieldId(fieldId: number) {
    // Join student fields and students to get students with the given fieldId
    const studentFields = await studentFieldService.findStudentFieldsByFieldId(fieldId);
    const studentIds = studentFields.map(f => f.studentId);
    if (studentIds.length === 0) return [];
    const result = await db.select().from(studentTable).where(inArray(studentTable.id, studentIds));
    const formattedStudents = await Promise.all(result.map(async (student) => await formatStudent(student)));
    return formattedStudents;
}

export async function formatStudent(student: Student) {
    // 1. Get the event for this student
    const event = await db.select().from(eventTable).where(eq(eventTable.id, student.eventId as number)).then(events => events[0]);
    if (!event) return { ...student, fields: [] };

    // 2. Get the alert for this event
    const alert = await db.select().from(alertTable).where(eq(alertTable.id, event.alertId as number)).then(alerts => alerts[0]);
    if (!alert) return { ...student, fields: [] };

    // 3. Get the field templates for this alert
    const fieldTemplates = await db.select().from(fieldTable).where(eq(fieldTable.alertId, alert.id as number)).orderBy(asc(fieldTable.sequence));

    // 4. Get the student's field values
    const studentFields = await studentFieldService.findStudentFieldsByStudentId(student.id as number);

    // 5. Build the obj and fields array
    const obj: Record<string, string> = {};
    const fields: { fieldId: number; name: string; value: string }[] = [];
    for (const fieldTemplate of fieldTemplates) {
        const studentField = studentFields.find(f => f.fieldId == fieldTemplate.id);
        const value = studentField?.value || '';
        obj[fieldTemplate.name] = value;
        fields.push({ fieldId: fieldTemplate.id, name: fieldTemplate.name, value });
    }


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { eventId, id, whatsapp, updatedAt, notificationSuccess } = student;

    console.log("obj:", {
        id,
        event: event.name,
        alert: alert.name,
        ...obj,
        whatsapp,
        notificationSuccess,
        updatedAt,
    });

    return {
        id,
        event: event.name,
        alert: alert.name,
        ...obj,
        whatsapp,
        notificationSuccess: notificationSuccess ? "Sent" : undefined,
        updatedAt,
    }
}