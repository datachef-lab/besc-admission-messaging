import db from "@/db/index";
import { eventTable, type Event } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createEvent(data: Omit<Event, "id" | "createdAt" | "updatedAt">) {
    const result = await db.insert(eventTable).values(data).returning();
    return result[0];
}

export async function findEventById(id: number) {
    const result = await db.select().from(eventTable).where(eq(eventTable.id, id));
    return result[0];
}

export async function findEventsByUserId(userId: number) {
    return await db.select().from(eventTable).where(eq(eventTable.userId, userId));
}

export async function findEventsByAlertId(alertId: number) {
    return await db.select().from(eventTable).where(eq(eventTable.alertId, alertId));
}

export async function updateEvent(id: number, data: Partial<Omit<Event, "id" | "createdAt" | "updatedAt">>) {
    const result = await db
        .update(eventTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(eventTable.id, id))
        .returning();
    return result[0];
}

export async function deleteEvent(id: number) {
    const result = await db.delete(eventTable).where(eq(eventTable.id, id)).returning();
    return result[0];
}

export async function findAllEvents() {
    return await db.select().from(eventTable);
} 