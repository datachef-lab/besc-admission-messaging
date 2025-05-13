import { relations } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, varchar, timestamp, boolean, integer, text } from "drizzle-orm/pg-core";

export const userTable = pgTable("users", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).unique(),
    whatsapp: varchar({ length: 255 }).notNull().unique(),
    isActive: boolean().default(true),
    isAdmin: boolean().notNull().default(false),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
});

export const userTableSchema = createInsertSchema(userTable);

export type User = z.infer<typeof userTableSchema>;

// ------------------------------------------------------------------------------------------------------------------------

export const alertTable = pgTable("alerts", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    template: varchar({ length: 255 }).unique(),
    previewText: text("preview_text"),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
});

export const alertTableSchema = createInsertSchema(alertTable);

export type Alert = z.infer<typeof alertTableSchema>;

// ------------------------------------------------------------------------------------------------------------------------

export const fieldTable = pgTable("fields", {
    id: serial().primaryKey(),
    alertId: integer("alert_id_fk").references(() => alertTable.id).notNull(),
    name: varchar({ length: 255 }).notNull(),
    sequence: integer().notNull(),
    flag: boolean().default(true),
    frequecy: integer().default(1).notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
});

export const fieldTableRelations = relations(fieldTable, ({ one }) => ({
    alert: one(alertTable, {
        fields: [fieldTable.alertId],
        references: [alertTable.id],
    }),
}));

export const fieldTableSchema = createInsertSchema(fieldTable);

export type Field = z.infer<typeof fieldTableSchema>;

// ------------------------------------------------------------------------------------------------------------------------

export const eventTable = pgTable("events", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk").references(() => userTable.id),
    alertId: integer("alert_id_fk").references(() => alertTable.id).notNull(),
    name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
});

export const eventTableRelations = relations(eventTable, ({ one }) => ({
    user: one(userTable, {
        fields: [eventTable.userId],
        references: [userTable.id],
    }),
    alert: one(alertTable, {
        fields: [eventTable.alertId],
        references: [alertTable.id],
    }),
}));

export const eventTableSchema = createInsertSchema(eventTable);

export type Event = z.infer<typeof eventTableSchema>;

// ------------------------------------------------------------------------------------------------------------------------

export const studentTable = pgTable("students", {
    id: serial().primaryKey(),
    eventId: integer("event_id_fk").references(() => eventTable.id).notNull(),
    email: varchar({ length: 255 }),
    whatsapp: varchar({ length: 255 }).notNull(),
    notificationSuccess: boolean("notification_success").default(false),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});

export const studentTableRelations = relations(studentTable, ({ one }) => ({
    event: one(eventTable, {
        fields: [studentTable.eventId],
        references: [eventTable.id],
    }),
}));

export const studentTableSchema = createInsertSchema(studentTable);

export type Student = z.infer<typeof studentTableSchema>;

// ------------------------------------------------------------------------------------------------------------------------

export const otpTable = pgTable("otps", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk").references(() => userTable.id).notNull(),
    code: varchar({ length: 255 }).notNull(),
    expiresAt: timestamp().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
});

export const otpTableRelations = relations(otpTable, ({ one }) => ({
    user: one(userTable, {
        fields: [otpTable.userId],
        references: [userTable.id],
    }),
}));

export const otpTableSchema = createInsertSchema(otpTable);

export type Otp = z.infer<typeof otpTableSchema>;


// ------------------------------------------------------------------------------------------------------------------------

export const studentFieldTable = pgTable("student_fields", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").references(() => studentTable.id).notNull(),
    fieldId: integer("field_id_fk").references(() => fieldTable.id).notNull(),
    value: varchar({ length: 255 }),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});

export const studentFieldTableRelations = relations(studentFieldTable, ({ one }) => ({
    student: one(studentTable, {
        fields: [studentFieldTable.studentId],
        references: [studentTable.id],
    }),
    field: one(fieldTable, {
        fields: [studentFieldTable.fieldId],
        references: [fieldTable.id],
    }),
}));

export const studentFieldTableSchema = createInsertSchema(studentFieldTable);

export type StudentField = z.infer<typeof studentFieldTableSchema>;