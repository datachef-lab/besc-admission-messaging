import { NextResponse } from "next/server";
import * as eventService from "@/lib/services/event.service";
import { getAllEvents } from "@/lib/services/event.service";

export async function GET() {
    try {
        const events = await getAllEvents();
        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const event = await eventService.createEvent(body);
        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
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
        console.error("Error updating event:", error);
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
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 