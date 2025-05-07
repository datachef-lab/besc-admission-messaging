import { NextResponse } from "next/server";
import * as userService from "@/lib/services/user.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const email = searchParams.get("email");
        const whatsapp = searchParams.get("whatsapp");

        if (id) {
            const user = await userService.findUserById(Number(id));
            if (!user) {
                return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: user });
        }

        if (email) {
            const user = await userService.findUserByEmail(email);
            if (!user) {
                return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: user });
        }

        if (whatsapp) {
            const user = await userService.findUserByWhatsapp(whatsapp);
            if (!user) {
                return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: user });
        }

        const users = await userService.findAllUsers();
        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        console.error("Error in GET /api/users:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}



export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const toggleActive = searchParams.get("toggleActive");

        if (!id) {
            return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
        }

        let result;
        if (toggleActive === "true") {
            result = await userService.toggleUserActive(Number(id));
        } else {
            const body = await request.json();
            result = await userService.updateUser(Number(id), body);
        }

        if (!result) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Error in PUT /api/users:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
} 