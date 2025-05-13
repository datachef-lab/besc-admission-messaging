/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import * as studentService from "@/lib/services/student.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const eventId = searchParams.get("eventId");
        const fieldId = searchParams.get("fieldId");

        if (id) {
            const student = await studentService.findStudentById(Number(id));
            return NextResponse.json(student);
        }

        if (eventId) {
            const students = await studentService.findStudentsByEventId(Number(eventId));
            return NextResponse.json(students);
        }

        if (fieldId) {
            const students = await studentService.findStudentsByFieldId(Number(fieldId));
            return NextResponse.json(students);
        }

        const students = await studentService.findAllStudents();
        return NextResponse.json(students);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const student = await studentService.createStudent(body);
        return NextResponse.json(student, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const updateStatus = searchParams.get("updateStatus");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        if (updateStatus === "true") {
            const body = await request.json();
            const student = await studentService.updateNotificationStatus(Number(id), body.success);
            return NextResponse.json(student);
        }

        const body = await request.json();
        const student = await studentService.updateStudent(Number(id), body);
        return NextResponse.json(student);
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

        const student = await studentService.deleteStudent(Number(id));
        return NextResponse.json(student);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 