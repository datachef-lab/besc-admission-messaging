import { NextResponse } from "next/server";
import * as alertService from "@/lib/services/alert.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const name = searchParams.get("name");

        if (id) {
            const alert = await alertService.findAlertById(Number(id));
            return NextResponse.json(alert);
        }

        if (name) {
            const alert = await alertService.findAlertByName(name);
            return NextResponse.json(alert);
        }

        const alerts = await alertService.findAllAlerts();
        return NextResponse.json(alerts);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const alert = await alertService.createAlert(body);
        return NextResponse.json(alert, { status: 201 });
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
        const alert = await alertService.updateAlert(Number(id), body);
        return NextResponse.json(alert);
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

        const alert = await alertService.deleteAlert(Number(id));
        return NextResponse.json(alert);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 