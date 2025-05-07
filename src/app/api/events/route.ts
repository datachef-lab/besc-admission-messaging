import { NextResponse } from "next/server";
import * as eventService from "@/lib/services/event.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const userId = searchParams.get("userId");
        const alertId = searchParams.get("alertId");

        if (id) {
            const event = await eventService.findEventById(Number(id));
            return NextResponse.json(event);
        }

        if (userId) {
            const events = await eventService.findEventsByUserId(Number(userId));
            return NextResponse.json(events);
        }

        if (alertId) {
            const events = await eventService.findEventsByAlertId(Number(alertId));
            return NextResponse.json(events);
        }

        const events = await eventService.findAllEvents();
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const event = await eventService.createEvent(body);
        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const event = await eventService.updateEvent(Number(id), body);
        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const event = await eventService.deleteEvent(Number(id));
        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 