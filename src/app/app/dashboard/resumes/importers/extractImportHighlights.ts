import type { ResumeData } from "@/types/resume";

const stripHtml = (value: string) =>
    value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const normalizeText = (value: string) =>
    stripHtml(value).replace(/\s+/g, " ").trim();

const extractKeywordsFromText = (
    originalText: string,
    resume: ResumeData
): string[] => {
    const keywords: string[] = [];
    const normalizedOriginal = normalizeText(originalText);

    const pushIfInOriginal = (text: string) => {
        const normalized = normalizeText(text);
        if (!normalized || normalized.length < 2) return;
        if (normalizedOriginal.includes(normalized)) {
            keywords.push(normalized);
        }
    };

    pushIfInOriginal(resume.basic?.name ?? "");
    pushIfInOriginal(resume.basic?.title ?? "");
    pushIfInOriginal(resume.basic?.email ?? "");
    pushIfInOriginal(resume.basic?.phone ?? "");
    pushIfInOriginal(resume.basic?.location ?? "");

    resume.education?.forEach((edu) => {
        pushIfInOriginal(edu.school ?? "");
        pushIfInOriginal(edu.major ?? "");
        pushIfInOriginal(edu.degree ?? "");
    });

    resume.experience?.forEach((exp) => {
        pushIfInOriginal(exp.company ?? "");
        pushIfInOriginal(exp.position ?? "");
        const details = stripHtml(exp.details ?? "");
        if (details && normalizedOriginal.includes(normalizeText(details))) {
            keywords.push(normalizeText(details));
        }
    });

    resume.projects?.forEach((project) => {
        pushIfInOriginal(project.name ?? "");
        pushIfInOriginal(project.role ?? "");
        const desc = stripHtml(project.description ?? "");
        if (desc && normalizedOriginal.includes(normalizeText(desc))) {
            keywords.push(normalizeText(desc));
        }
    });

    pushIfInOriginal(resume.skillContent ?? "");
    pushIfInOriginal(resume.selfEvaluationContent ?? "");

    return Array.from(new Set(keywords))
        .map((k) => (k.length > 180 ? k.slice(0, 180) : k))
        .filter(Boolean);
};

const extractPathsFromText = (
    originalText: string,
    resume: ResumeData
): string[] => {
    const paths: string[] = [];
    const normalizedOriginal = normalizeText(originalText);

    const pushPathIfInOriginal = (path: string, value: string) => {
        const normalized = normalizeText(value);
        if (!normalized) return;
        if (normalizedOriginal.includes(normalized)) {
            paths.push(path);
        }
    };

    pushPathIfInOriginal("basic.name", resume.basic?.name ?? "");
    pushPathIfInOriginal("basic.title", resume.basic?.title ?? "");
    pushPathIfInOriginal("basic.email", resume.basic?.email ?? "");
    pushPathIfInOriginal("basic.phone", resume.basic?.phone ?? "");
    pushPathIfInOriginal("basic.location", resume.basic?.location ?? "");

    resume.education?.forEach((edu, index) => {
        pushPathIfInOriginal(`education.${index}.school`, edu.school ?? "");
        pushPathIfInOriginal(`education.${index}.major`, edu.major ?? "");
        pushPathIfInOriginal(`education.${index}.degree`, edu.degree ?? "");
    });

    resume.experience?.forEach((exp, index) => {
        pushPathIfInOriginal(`experience.${index}.company`, exp.company ?? "");
        pushPathIfInOriginal(`experience.${index}.position`, exp.position ?? "");
        pushPathIfInOriginal(`experience.${index}.details`, exp.details ?? "");
    });

    resume.projects?.forEach((project, index) => {
        pushPathIfInOriginal(`projects.${index}.name`, project.name ?? "");
        pushPathIfInOriginal(`projects.${index}.role`, project.role ?? "");
        pushPathIfInOriginal(`projects.${index}.description`, project.description ?? "");
    });

    pushPathIfInOriginal("skillContent", resume.skillContent ?? "");
    pushPathIfInOriginal("selfEvaluationContent", resume.selfEvaluationContent ?? "");

    return Array.from(new Set(paths));
};

export const extractImportHighlights = (
    originalText: string,
    resume: ResumeData
): { keywords: string[]; paths: string[] } => {
    return {
        keywords: extractKeywordsFromText(originalText, resume),
        paths: extractPathsFromText(originalText, resume),
    };
};