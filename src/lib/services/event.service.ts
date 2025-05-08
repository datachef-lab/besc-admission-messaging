import db from "@/db/index";
import { eventTable, studentTable, type Event } from "@/db/schema";
import { EventType } from "@/types/event";
import { eq, desc, count, and } from "drizzle-orm";
import { findAlertById } from "@/lib/services/alert.service";

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

export async function deleteEvent(id: number) {
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