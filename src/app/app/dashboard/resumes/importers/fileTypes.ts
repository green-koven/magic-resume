export type ResumeImportFileType =
    | "json"
    | "txt"
    | "md"
    | "pdf"
    | "docx"
    | "unsupported";

export const RESUME_IMPORT_ACCEPT =
    ".json,.txt,.md,.pdf,.docx,application/json,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const TEXT_RESUME_IMPORT_ACCEPT =
    ".txt,.md,text/plain,text/markdown";

export function getResumeImportFileType(
    file: File
): ResumeImportFileType {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".json")) {
        return "json";
    }

    if (fileName.endsWith(".txt")) {
        return "txt";
    }

    if (fileName.endsWith(".md")) {
        return "md";
    }

    if (fileName.endsWith(".pdf")) {
        return "pdf";
    }

    if (fileName.endsWith(".docx")) {
        return "docx";
    }

    return "unsupported";
}

export function isSupportedResumeImportFileType(
    fileType: ResumeImportFileType
) {
    return fileType !== "unsupported";
}