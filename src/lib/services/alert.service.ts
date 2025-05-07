import db from "@/db/index";
import { alertTable, fieldTable, type Alert } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createAlert(data: Omit<Alert, "id" | "createdAt" | "updatedAt">) {
    const result = await db.insert(alertTable).values(data).returning();

    const formattedAlert = await formatAlert(result[0]);
    return formattedAlert;
}

export async function findAlertById(id: number) {
    const result = await db.select().from(alertTable).where(eq(alertTable.id, id));
    const formattedAlert = await formatAlert(result[0]);
    return formattedAlert;
}

export async function findAlertByName(name: string) {
    const result = await db.select().from(alertTable).where(eq(alertTable.name, name));
    const formattedAlert = await formatAlert(result[0]);
    return formattedAlert;
}

export async function updateAlert(id: number, data: Partial<Omit<Alert, "id" | "createdAt" | "updatedAt">>) {
    const result = await db
        .update(alertTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(alertTable.id, id))
        .returning();
    const formattedAlert = await formatAlert(result[0]);
    return formattedAlert;
}

export async function deleteAlert(id: number) {
    const result = await db.delete(alertTable).where(eq(alertTable.id, id)).returning();
    const formattedAlert = await formatAlert(result[0]);
    return formattedAlert;
}

export async function findAllAlerts() {
    const result = await db.select().from(alertTable);
    const formattedAlerts = await Promise.all(result.map(formatAlert));
    return formattedAlerts;
} 

export async function formatAlert(alert: Alert) {
    const fields = await db
        .select()
        .from(fieldTable)
        .where(eq(fieldTable.alertId, alert.id as number));

    return {
        ...alert,
        fields,
    };
}