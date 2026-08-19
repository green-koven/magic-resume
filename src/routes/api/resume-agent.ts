import { createFileRoute } from "@tanstack/react-router";
import { AI_MODEL_CONFIGS, AIModelType } from "@/config/ai";
import {
  formatGeminiErrorMessage,
  getGeminiModelInstance,
} from "@/lib/server/gemini";
import type {
  Education,
  Experience,
  Project,
  ResumeData,
} from "@/types/resume";
import type { ResumeAgentRequest } from "@/types/resumeAgent";

const parseJsonPayload = (content: string) => {
  const text = content.trim();

  try {
    return JSON.parse(text);
  } catch (error) {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const fencedContent = fenced?.[1];
  if (fencedContent) {
    try {
      return JSON.parse(fencedContent.trim());
    } catch (error) {}
  }

  const objectBlock = text.match(/{[\s\S]*}/);
  const objectContent = objectBlock?.[0];
  if (objectContent) {
    try {
      return JSON.parse(objectContent);
    } catch (error) {}
  }

  return null;
};

const parseUpstreamJson = (raw: string) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normalizeEducation = (
  nextItems: unknown,
  originalItems: Education[]
): Education[] => {
  if (!Array.isArray(nextItems)) return originalItems;

  return nextItems.map((item, index) => {
    const original = originalItems[index];
    const next = item as Partial<Education>;

    return {
      id: original?.id || crypto.randomUUID(),
      school: next.school ?? original?.school ?? "",
      major: next.major ?? original?.major ?? "",
      degree: next.degree ?? original?.degree ?? "",
      startDate: next.startDate ?? original?.startDate ?? "",
      endDate: next.endDate ?? original?.endDate ?? "",
      gpa: next.gpa ?? original?.gpa,
      description: next.description ?? original?.description ?? "",
      visible: next.visible ?? original?.visible ?? true,
    };
  });
};

const normalizeExperience = (
  nextItems: unknown,
  originalItems: Experience[]
): Experience[] => {
  if (!Array.isArray(nextItems)) return originalItems;

  return nextItems.map((item, index) => {
    const original = originalItems[index];
    const next = item as Partial<Experience>;

    return {
      id: original?.id || crypto.randomUUID(),
      company: next.company ?? original?.company ?? "",
      position: next.position ?? original?.position ?? "",
      date: next.date ?? original?.date ?? "",
      details: next.details ?? original?.details ?? "",
      visible: next.visible ?? original?.visible ?? true,
    };
  });
};

const normalizeProjects = (
  nextItems: unknown,
  originalItems: Project[]
): Project[] => {
  if (!Array.isArray(nextItems)) return originalItems;

  return nextItems.map((item, index) => {
    const original = originalItems[index];
    const next = item as Partial<Project>;

    return {
      id: original?.id || crypto.randomUUID(),
      name: next.name ?? original?.name ?? "",
      role: next.role ?? original?.role ?? "",
      date: next.date ?? original?.date ?? "",
      description: next.description ?? original?.description ?? "",
      visible: next.visible ?? original?.visible ?? true,
      link: next.link ?? original?.link,
      linkLabel: next.linkLabel ?? original?.linkLabel,
    };
  });
};

const normalizeOptimizedResume = (
  originalResume: ResumeData,
  aiResume: Partial<ResumeData>
): ResumeData => ({
  ...originalResume,
  ...aiResume,
  id: originalResume.id,
  createdAt: originalResume.createdAt,
  updatedAt: new Date().toISOString(),
  templateId: originalResume.templateId,
  basic: {
    ...originalResume.basic,
    ...(aiResume.basic || {}),
  },
  education: normalizeEducation(aiResume.education, originalResume.education),
  experience: normalizeExperience(aiResume.experience, originalResume.experience),
  projects: normalizeProjects(aiResume.projects, originalResume.projects),
  certificates: originalResume.certificates,
  customData: originalResume.customData,
  menuSections: originalResume.menuSections,
  globalSettings: originalResume.globalSettings,
  activeSection: originalResume.activeSection,
  draggingProjectId: originalResume.draggingProjectId,
  skillContent: aiResume.skillContent ?? originalResume.skillContent,
  selfEvaluationContent:
    aiResume.selfEvaluationContent ?? originalResume.selfEvaluationContent,
});

export const Route = createFileRoute("/api/resume-agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ResumeAgentRequest;
          const {
            action,
            resume,
            jobDescription,
            instruction,
            apiKey,
            model,
            modelType,
            apiEndpoint,
            locale,
          } = body;

          if (action !== "optimize") {
            return Response.json(
              { error: `Unsupported action: ${action}` },
              { status: 400 }
            );
          }

          if (!resume || !apiKey || !modelType || !jobDescription?.trim()) {
            return Response.json(
              { error: "Missing resume, API key, model type, or job description" },
              { status: 400 }
            );
          }

          const language = locale === "en" ? "English" : "Chinese";
          const systemPrompt = `你是一个专业的求职简历优化智能体。你需要根据岗位需求优化用户当前简历，让简历更匹配岗位、更清晰、更专业。

严格规则：
1. 只输出一个合法 JSON 对象，不要输出 Markdown、解释、代码块。
2. JSON 必须包含 message 和 optimizedResume 两个字段。
3. optimizedResume 必须保持原简历 ResumeData 结构。
4. 不要编造工作经历、教育经历、公司、学校、证书。
5. 可以优化表达、合并技能、突出岗位相关关键词，但不要夸大事实。
6. 请使用 ${language} 输出。
7. rich text 字段可以使用简单 HTML 列表，如 <ul><li>...</li></ul>。

返回格式：
{
  "message": "本次优化摘要",
  "optimizedResume": { ...完整 ResumeData JSON... }
}`;

          const userPrompt = JSON.stringify(
            {
              jobDescription,
              instruction,
              resume,
            },
            null,
            2
          );

          let aiContent = "";

          if (modelType === "gemini") {
            const modelInstance = getGeminiModelInstance({
              apiKey,
              model: model || "gemini-flash-latest",
              systemInstruction: systemPrompt,
              generationConfig: {
                temperature: 0.3,
                responseMimeType: "application/json",
              },
            });

            const result = await modelInstance.generateContent(userPrompt);
            aiContent = result.response.text();
          } else {
            const modelConfig = AI_MODEL_CONFIGS[modelType as AIModelType];
            if (!modelConfig) {
              return Response.json(
                { error: `Unsupported AI model type: ${modelType}` },
                { status: 400 }
              );
            }

            if (modelType === "openai" && !apiEndpoint?.trim()) {
              return Response.json(
                { error: "OpenAI-compatible provider requires an API endpoint" },
                { status: 400 }
              );
            }

            const response = await fetch(modelConfig.url(apiEndpoint), {
              method: "POST",
              headers: modelConfig.headers(apiKey),
              body: JSON.stringify({
                model: modelConfig.requiresModelId
                  ? model
                  : modelConfig.defaultModel,
                response_format: {
                  type: "json_object",
                },
                messages: [
                  {
                    role: "system",
                    content: systemPrompt,
                  },
                  {
                    role: "user",
                    content: userPrompt,
                  },
                ],
              }),
            });

            const raw = await response.text();

            if (!response.ok) {
              const errorData = parseUpstreamJson(raw);
              const errorMessage =
                errorData?.error?.message ||
                errorData?.message ||
                (raw
                  ? raw.slice(0, 300)
                  : `Upstream API error: ${response.status}`);

              return Response.json(
                { error: errorMessage },
                { status: response.status }
              );
            }

            const upstream = parseUpstreamJson(raw);
            if (!upstream) {
              return Response.json(
                {
                  error: raw.trim()
                    ? `AI provider returned non-JSON response: ${raw
                        .trim()
                        .slice(0, 300)}`
                    : "AI provider returned empty response",
                },
                { status: 502 }
              );
            }

            aiContent = upstream?.choices?.[0]?.message?.content || raw;
          }

          const parsed = parseJsonPayload(aiContent);
          const optimizedResume = parsed?.optimizedResume;

          if (!optimizedResume) {
            return Response.json(
              { error: "AI did not return optimizedResume" },
              { status: 500 }
            );
          }

          return Response.json({
            message: parsed?.message || "简历已根据岗位需求完成优化",
            optimizedResume: normalizeOptimizedResume(resume, optimizedResume),
          });
        } catch (error) {
          console.error("Error in resume agent:", error);
          return Response.json(
            { error: formatGeminiErrorMessage(error) },
            { status: 500 }
          );
        }
      },
    },
  },
});
