import db from "@/db/index";
import { fieldTable, type Field } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createField(data: Omit<Field, "id" | "createdAt" | "updatedAt">) {
    const result = await db.insert(fieldTable).values(data).returning();
    return result[0];
}

export async function findFieldById(id: number) {
    const result = await db.select().from(fieldTable).where(eq(fieldTable.id, id));
    return result[0];
}

export async function findFieldsByAlertId(alertId: number) {
    return await db.select().from(fieldTable).where(eq(fieldTable.alertId, alertId));
}

export async function updateField(id: number, data: Partial<Omit<Field, "id" | "createdAt" | "updatedAt">>) {
    const result = await db
        .update(fieldTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(fieldTable.id, id))
        .returning();
    return result[0];
}

export async function deleteField(id: number) {
    const result = await db.delete(fieldTable).where(eq(fieldTable.id, id)).returning();
    return result[0];
}

export async function findAllFields() {
    return await db.select().from(fieldTable);
} 