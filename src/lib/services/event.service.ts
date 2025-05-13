import db from "@/db/index";
import { eventTable, studentTable, studentFieldTable, type Event, fieldTable } from "@/db/schema";
import { EventType } from "@/types/event";
import { eq, desc, count, and, inArray, asc } from "drizzle-orm";
import { findAlertById } from "@/lib/services/alert.service";
import { sendWhatsAppMessage } from "../notifications/interakt-messaging";
import * as studentFieldService from "./student-field.service";

export async function createEvent(data: Omit<Event, "id" | "createdAt" | "updatedAt">) {
    const result = await db.insert(eventTable).values(data).returning();

    const formattedEvent = await formatEvent(result[0]);

    return formattedEvent;
}

export async function findEventById(id: number) {
    const result = await db.select().from(eventTable).where(eq(eventTable.id, id));
    const formattedEvent = await formatEvent(result[0]);
    return formattedEvent;
}

export async function findEventsByUserId(userId: number) {
    const result = await db.select().from(eventTable).where(eq(eventTable.userId, userId));
    const formattedEvents = await Promise.all(result.map(async (event) => await formatEvent(event)));
    return formattedEvents;
}

export async function findEventsByAlertId(alertId: number) {
    const result = await db.select().from(eventTable).where(eq(eventTable.alertId, alertId));
    const formattedEvents = await Promise.all(result.map(async (event) => await formatEvent(event)));
    return formattedEvents;
}

export async function updateEvent(id: number, data: Partial<Omit<Event, "id" | "createdAt" | "updatedAt">>) {
    const result = await db
        .update(eventTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(eventTable.id, id))
        .returning();
    const formattedEvent = await formatEvent(result[0]);
    return formattedEvent;
}

export async function resendNotifications(eventId: number) {

    const event = await findEventById(eventId);

    const students = await db.select().from(studentTable).where(eq(studentTable.eventId, eventId));

    const alert = await findAlertById(event.alertId);


    for (const st of students) {
        // Get all fields for the event's alert in sequence order
        const eventFields = await db
            .select()
            .from(fieldTable)
            .where(eq(fieldTable.alertId, event.alertId))
            .orderBy(asc(fieldTable.sequence));

        // Get student fields with their values
        const studentFieldValues = await studentFieldService.findStudentFieldsByStudentId(st.id);

        // Create message array based on field sequence
        const messageArr = eventFields.map(field => {
            const studentField = studentFieldValues.find(sf => sf.fieldId === field.id);
            return studentField?.value || '';
        });

        await sendWhatsAppMessage(st.whatsapp, messageArr, alert.template as string);
    }

}

export async function deleteEvent(id: number) {
    // 1. Find all students for the event
    const students = await db.select().from(studentTable).where(eq(studentTable.eventId, id));
    const studentIds = students.map(s => s.id);

    // 2. Delete all student_fields for these students
    if (studentIds.length > 0) {
        await db.delete(studentFieldTable).where(inArray(studentFieldTable.studentId, studentIds));
    }

    // 3. Delete all students for the event
    await db.delete(studentTable).where(eq(studentTable.eventId, id));

    // 4. Delete the event itself
    const result = await db.delete(eventTable).where(eq(eventTable.id, id)).returning();
    const formattedEvent = await formatEvent(result[0]);
    return formattedEvent;
}

export async function findAllEvents() {
    const result = await db.select().from(eventTable);
    const formattedEvents = await Promise.all(result.map(async (event) => await formatEvent(event)));
    return formattedEvents;
}

export async function getAllEvents() {
    const result = await db.select().from(eventTable).orderBy(desc(eventTable.createdAt));
    const formattedEvents = await Promise.all(result.map(async (event) => await formatEvent(event)));
    return formattedEvents;
}

export async function getEventById(id: number) {
    const result = await db.select().from(eventTable).where(eq(eventTable.id, id)).limit(1);
    const formattedEvent = await formatEvent(result[0]);
    return formattedEvent;
}

export async function formatEvent(event: Event): Promise<EventType & { alertName: string }> {
    const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(studentTable)
        .where(eq(studentTable.eventId, event.id as number));

    const [{ totalSent }] = await db
        .select({ totalSent: count() })
        .from(studentTable)
        .where(
            and(
                eq(studentTable.eventId, event.id as number),
                eq(studentTable.notificationSuccess, true)
            ),
        );

    // Fetch alert name
    let alertName = "";
    if (event.alertId) {
        const alert = await findAlertById(event.alertId);
        alertName = alert?.name || "";
    }

    return {
        ...event,
        totalStudents: totalCount,
        nottificationFailed: totalCount - totalSent,
        alertName,
    };
}