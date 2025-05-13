import { NextResponse } from "next/server";
import { getAlertPreviewImagePath } from "@/lib/services/alert-docs.service";
import fs from "fs";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get("template");
    if (!template) {
        return NextResponse.json({ error: "Template name required" }, { status: 400 });
    }
    const imagePath = getAlertPreviewImagePath(template);
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `inline; filename=${template}.png`,
            },
        });
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "Preview image not found" }, { status: 404 });
    }
} 