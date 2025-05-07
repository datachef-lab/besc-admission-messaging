import { NextResponse } from "next/server";
import * as fieldService from "@/lib/services/field.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const alertId = searchParams.get("alertId");

        if (id) {
            const field = await fieldService.findFieldById(Number(id));
            return NextResponse.json(field);
        }

        if (alertId) {
            const fields = await fieldService.findFieldsByAlertId(Number(alertId));
            return NextResponse.json(fields);
        }

        const fields = await fieldService.findAllFields();
        return NextResponse.json(fields);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const field = await fieldService.createField(body);
        return NextResponse.json(field, { status: 201 });
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
        const field = await fieldService.updateField(Number(id), body);
        return NextResponse.json(field);
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

        const field = await fieldService.deleteField(Number(id));
        return NextResponse.json(field);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 