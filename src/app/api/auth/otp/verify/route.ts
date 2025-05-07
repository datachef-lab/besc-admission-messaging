import { NextResponse } from "next/server";
import * as otpService from "@/lib/services/otp.service";
import { findUserByEmail, findUserByWhatsapp } from "@/lib/services/user.service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, code } = body;

        console.log(text, code)

        if (!text) {
            return NextResponse.json(
                { success: false, message: "Phone or email is required" },
                { status: 400 }
            );
        }

        if (!code) {
            return NextResponse.json(
                { success: false, message: "OTP code is required" },
                { status: 400 }
            );
        }

        // Find user by email or WhatsApp
        let user = await findUserByEmail(text);
        if (!user) {
            user = await findUserByWhatsapp(text);
            if (!user) {
                return NextResponse.json(
                    { success: false, message: "User not found" },
                    { status: 404 }
                );
            }
        }

        const result = await otpService.verifyOtp(user.id, code);

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in POST /api/otp/verify:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
} 