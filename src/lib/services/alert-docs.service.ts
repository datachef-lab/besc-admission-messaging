import { env } from "process";

export function getAlertPreviewImagePath(templateName: string): string {
    const docsPath = process.env.DOCS_PATH || "";
    if (!docsPath || !templateName) return "";
    return `${docsPath}/${templateName}.png`;
} 