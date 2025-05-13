import { NextResponse } from "next/server";
import * as eventService from "@/lib/services/event.service";

export async function POST(request: Request) {
    try {
        const { eventId } = await request.json();
        if (!eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
        }
        await eventService.resendNotifications(Number(eventId));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error resending notifications:", error);
        return NextResponse.json({ error: "Failed to resend notifications" }, { status: 500 });
    }
} 