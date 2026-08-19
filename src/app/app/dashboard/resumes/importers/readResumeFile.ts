import mammoth from "mammoth";
import { getResumeImportFileType } from "./fileTypes";

export type ResumeImportContent =
    | {
    kind: "structured";
    fileType: "json";
    fileName: string;
    data: unknown;
    originalText: string;
}
    | {
    kind: "text";
    fileType: "txt" | "md" | "docx";
    fileName: string;
    text: string;
    originalText: string;
};

export async function readResumeImportFile(
    file: File
): Promise<ResumeImportContent> {
    const fileType = getResumeImportFileType(file);

    if (fileType === "json") {
        const originalText = await file.text();

        try {
            return {
                kind: "structured",
                fileType: "json",
                fileName: file.name,
                data: JSON.parse(originalText),
                originalText,
            };
        } catch {
            throw new Error("JSON 文件格式不正确，无法解析");
        }
    }

    if (fileType === "txt" || fileType === "md") {
        const originalText = await file.text();
        const text = originalText.trim();

        if (!text) {
            throw new Error("文件内容为空");
        }

        return {
            kind: "text",
            fileType,
            fileName: file.name,
            text,
            originalText,
        };
    }

    if (fileType === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const originalText = result.value;
        const text = originalText.trim();

        if (!text) {
            throw new Error("Word 文件内容为空，无法读取简历文本");
        }

        return {
            kind: "text",
            fileType,
            fileName: file.name,
            text,
            originalText,
        };
    }

    if (fileType === "unsupported") {
        throw new Error("暂不支持该文件格式");
    }

    throw new Error(`${fileType.toUpperCase()} 文件解析将在下一步实现`);
}