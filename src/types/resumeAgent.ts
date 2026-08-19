import type { ResumeData } from "./resume";

export type ResumeAgentAction = "optimize";

export type ResumeAgentMessage = {
    role: "user" | "assistant";
    content: string;
};

export type ResumeAgentRequest = {
    action: ResumeAgentAction;
    resume: ResumeData;
    jobDescription: string;
    instruction: string;
    apiKey: string;
    model?: string;
    modelType: string;
    apiEndpoint?: string;
    locale?: string;
    messages?: ResumeAgentMessage[];
};

export type ResumeAgentResponse = {
    message: string;
    optimizedResume: ResumeData;
};