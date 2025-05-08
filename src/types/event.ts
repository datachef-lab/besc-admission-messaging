import { Event } from "@/db/schema";

export interface EventType extends Event {
    totalStudents: number;
    nottificationFailed: number;
    alertName: string;
}