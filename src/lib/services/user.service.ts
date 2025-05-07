import db from "@/db/index";
import { userTable, type User } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">) {
    let existingUser: User | null = null;
    // Check if user already exists
    if (data.email) {
        existingUser = await findUserByEmail(data.email);
        if (existingUser) {
            return { success: false, message: "User already exists" };
        }
        else {
            existingUser = await findUserByWhatsapp(data.whatsapp);
            if (existingUser) {
                return { success: false, message: "User already exists" };
            }
        }
    }

    const result = await db.insert(userTable).values(data).returning();

    return result[0];
}

export async function findUserById(id: number) {
    const result = await db.select().from(userTable).where(eq(userTable.id, id));
    return result[0];
}

export async function findUserByEmail(email: string) {
    const result = await db.select().from(userTable).where(eq(userTable.email, email));
    return result[0];
}

export async function findUserByWhatsapp(whatsapp: string) {
    const result = await db.select().from(userTable).where(eq(userTable.whatsapp, whatsapp));
    return result[0];
}

export async function updateUser(id: number, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>) {
    const result = await db
        .update(userTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userTable.id, id))
        .returning();
    return result[0];
}

export async function toggleUserActive(id: number) {
    const user = await findUserById(id);
    if (!user) {
        return null;
    }

    const result = await db.update(userTable).set({ isActive: !user.isActive }).where(eq(userTable.id, id)).returning();

    return result[0];
}

export async function findAllUsers() {
    return await db.select().from(userTable);
}
