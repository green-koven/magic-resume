import { useMemo, useState } from "react";
import { Sparkles, Loader2, WandSparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet-no-overlay";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResumeStore } from "@/store/useResumeStore";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { useRouter } from "@/lib/navigation";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import type { ResumeData } from "@/types/resume";
import type { ResumeAgentResponse } from "@/types/resumeAgent";

type ResumeAgentDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const getSelectedApiKey = (state: {
  selectedModel: keyof typeof AI_MODEL_CONFIGS;
  doubaoApiKey: string;
  deepseekApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
}) => {
  if (state.selectedModel === "doubao") return state.doubaoApiKey;
  if (state.selectedModel === "openai") return state.openaiApiKey;
  if (state.selectedModel === "gemini") return state.geminiApiKey;
  return state.deepseekApiKey;
};

const getSelectedModel = (state: {
  selectedModel: keyof typeof AI_MODEL_CONFIGS;
  doubaoModelId: string;
  deepseekModelId: string;
  openaiModelId: string;
  geminiModelId: string;
  openaiApiEndpoint: string;
}) => {
  if (state.selectedModel === "doubao") return state.doubaoModelId;
  if (state.selectedModel === "openai") return state.openaiModelId;
  if (state.selectedModel === "gemini") return state.geminiModelId;

  const config = AI_MODEL_CONFIGS[state.selectedModel];
  return config.requiresModelId ? state.deepseekModelId : config.defaultModel;
};

const getResumeSummary = (resume: ResumeData) => {
  const lines = [
    resume.basic?.name,
    resume.basic?.title,
    resume.basic?.email,
    resume.basic?.phone,
  ].filter(Boolean);

  return lines.join(" · ");
};

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const summarizeText = (value: string) => {
  const text = stripHtml(value);
  if (!text) return "未填写";
  return text.length > 64 ? `${text.slice(0, 64)}...` : text;
};

const summarizeCount = (before: number, after: number) =>
  `${before} → ${after}`;

const getListSegments = (value: string) => {
  const segments: string[] = [];
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;

  while ((match = liPattern.exec(value))) {
    const text = summarizeText(match[1] || "");
    if (text && text !== "未填写") {
      segments.push(text);
    }
  }

  if (segments.length > 0) {
    return segments;
  }

  const text = stripHtml(value);
  return text ? [text] : [];
};

const normalizeKeyword = (value: string) =>
  stripHtml(value).replace(/\s+/g, " ").trim();

const getChangedPreviewKeywords = (
  beforeResume: ResumeData,
  afterResume: ResumeData
) => {
  const keywords: string[] = [];

  const pushChangedText = (before: string, after: string) => {
    const normalizedBefore = normalizeKeyword(before);
    const normalizedAfter = normalizeKeyword(after);
    if (!normalizedAfter || normalizedBefore === normalizedAfter) return;
    if (normalizedAfter.length < 2) return;
    keywords.push(normalizedAfter);
  };

  pushChangedText(beforeResume.title, afterResume.title);
  pushChangedText(beforeResume.basic?.name ?? "", afterResume.basic?.name ?? "");
  pushChangedText(beforeResume.basic?.title ?? "", afterResume.basic?.title ?? "");
  pushChangedText(beforeResume.basic?.email ?? "", afterResume.basic?.email ?? "");
  pushChangedText(beforeResume.basic?.phone ?? "", afterResume.basic?.phone ?? "");
  pushChangedText(beforeResume.basic?.location ?? "", afterResume.basic?.location ?? "");
  pushChangedText(
    beforeResume.selfEvaluationContent ?? "",
    afterResume.selfEvaluationContent ?? ""
  );

  const beforeSkills = new Set(getListSegments(beforeResume.skillContent ?? ""));
  getListSegments(afterResume.skillContent ?? "").forEach((segment) => {
    if (!beforeSkills.has(segment)) {
      keywords.push(segment);
    }
  });

  afterResume.projects?.forEach((project, index) => {
    const beforeProject = beforeResume.projects?.[index];
    pushChangedText(beforeProject?.name ?? "", project.name ?? "");
    pushChangedText(beforeProject?.role ?? "", project.role ?? "");
    pushChangedText(beforeProject?.date ?? "", project.date ?? "");
    getListSegments(project.description ?? "").forEach((segment) => {
      const beforeSegments = new Set(
        getListSegments(beforeProject?.description ?? "")
      );
      if (!beforeSegments.has(segment)) {
        keywords.push(segment);
      }
    });
  });

  afterResume.experience?.forEach((experience, index) => {
    const beforeExperience = beforeResume.experience?.[index];
    pushChangedText(beforeExperience?.company ?? "", experience.company ?? "");
    pushChangedText(beforeExperience?.position ?? "", experience.position ?? "");
    pushChangedText(beforeExperience?.date ?? "", experience.date ?? "");
    getListSegments(experience.details ?? "").forEach((segment) => {
      const beforeSegments = new Set(
        getListSegments(beforeExperience?.details ?? "")
      );
      if (!beforeSegments.has(segment)) {
        keywords.push(segment);
      }
    });
  });

  return Array.from(new Set(keywords))
    .map((keyword) => (keyword.length > 180 ? keyword.slice(0, 180) : keyword))
    .filter(Boolean);
};

const getChangedPreviewPaths = (
    beforeResume: ResumeData,
    afterResume: ResumeData
) => {
  const paths: string[] = [];

  const pushChangedPath = (path: string, before: unknown, after: unknown) => {
    const beforeValue = typeof before === "string" ? stripHtml(before) : before;
    const afterValue = typeof after === "string" ? stripHtml(after) : after;

    if (beforeValue !== afterValue) {
      paths.push(path);
    }
  };

  pushChangedPath("basic.name", beforeResume.basic?.name ?? "", afterResume.basic?.name ?? "");
  pushChangedPath("basic.title", beforeResume.basic?.title ?? "", afterResume.basic?.title ?? "");
  pushChangedPath("basic.email", beforeResume.basic?.email ?? "", afterResume.basic?.email ?? "");
  pushChangedPath("basic.phone", beforeResume.basic?.phone ?? "", afterResume.basic?.phone ?? "");
  pushChangedPath("basic.location", beforeResume.basic?.location ?? "", afterResume.basic?.location ?? "");
  pushChangedPath("skillContent", beforeResume.skillContent ?? "", afterResume.skillContent ?? "");
  pushChangedPath(
      "selfEvaluationContent",
      beforeResume.selfEvaluationContent ?? "",
      afterResume.selfEvaluationContent ?? ""
  );

  afterResume.projects?.forEach((project, index) => {
    const beforeProject = beforeResume.projects?.[index];

    pushChangedPath(`projects.${index}.name`, beforeProject?.name ?? "", project.name ?? "");
    pushChangedPath(`projects.${index}.role`, beforeProject?.role ?? "", project.role ?? "");
    pushChangedPath(`projects.${index}.date`, beforeProject?.date ?? "", project.date ?? "");
    pushChangedPath(
        `projects.${index}.description`,
        beforeProject?.description ?? "",
        project.description ?? ""
    );
  });

  afterResume.experience?.forEach((experience, index) => {
    const beforeExperience = beforeResume.experience?.[index];

    pushChangedPath(
      `experience.${index}.company`,
      beforeExperience?.company ?? "",
      experience.company ?? ""
    );
    pushChangedPath(
      `experience.${index}.position`,
      beforeExperience?.position ?? "",
      experience.position ?? ""
    );
    pushChangedPath(
      `experience.${index}.date`,
      beforeExperience?.date ?? "",
      experience.date ?? ""
    );
    pushChangedPath(
      `experience.${index}.details`,
      beforeExperience?.details ?? "",
      experience.details ?? ""
    );
  });
  afterResume.education?.forEach((education, index) => {
    const beforeEducation = beforeResume.education?.[index];

    pushChangedPath(
        `education.${index}.school`,
        beforeEducation?.school ?? "",
        education.school ?? ""
    );

    pushChangedPath(
        `education.${index}.major`,
        beforeEducation?.major ?? "",
        education.major ?? ""
    );

    pushChangedPath(
        `education.${index}.degree`,
        beforeEducation?.degree ?? "",
        education.degree ?? ""
    );

    pushChangedPath(
        `education.${index}.gpa`,
        beforeEducation?.gpa ?? "",
        education.gpa ?? ""
    );

    pushChangedPath(
        `education.${index}.date`,
        `${beforeEducation?.startDate ?? ""}-${beforeEducation?.endDate ?? ""}`,
        `${education.startDate ?? ""}-${education.endDate ?? ""}`
    );

    pushChangedPath(
        `education.${index}.description`,
        beforeEducation?.description ?? "",
        education.description ?? ""
    );
  });
  return Array.from(new Set(paths));
};

export function ResumeAgentDrawer({
  open,
  onOpenChange,
}: ResumeAgentDrawerProps) {
  const router = useRouter();
  const { activeResume, updateResume } = useResumeStore();
  const aiConfig = useAIConfigStore();

  const [jobDescription, setJobDescription] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [sourceResume, setSourceResume] = useState<ResumeData | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  const selectedApiKey = useMemo(() => getSelectedApiKey(aiConfig), [aiConfig]);
  const selectedModel = useMemo(() => getSelectedModel(aiConfig), [aiConfig]);
  const changeItems = useMemo(() => {
    const beforeResume = sourceResume || activeResume;
    if (!beforeResume || !optimizedResume) return [];

    const items: Array<{
      label: string;
      before: string;
      after: string;
    }> = [];

    const pushText = (label: string, before: string, after: string) => {
      const trimmedBefore = before.trim();
      const trimmedAfter = after.trim();
      if (trimmedBefore === trimmedAfter) return;
      items.push({
        label,
        before: trimmedBefore || "未填写",
        after: trimmedAfter || "未填写",
      });
    };

    const pushCount = (
      label: string,
      before: number | undefined,
      after: number | undefined
    ) => {
      const beforeValue = before ?? 0;
      const afterValue = after ?? 0;
      if (beforeValue === afterValue) return;
      items.push({
        label,
        before: String(beforeValue),
        after: String(afterValue),
      });
    };

    pushText("简历标题", beforeResume.title, optimizedResume.title);
    pushText("姓名", beforeResume.basic?.name ?? "", optimizedResume.basic?.name ?? "");
    pushText("求职意向", beforeResume.basic?.title ?? "", optimizedResume.basic?.title ?? "");
    pushText("邮箱", beforeResume.basic?.email ?? "", optimizedResume.basic?.email ?? "");
    pushText("电话", beforeResume.basic?.phone ?? "", optimizedResume.basic?.phone ?? "");
    pushText(
      "期望地点",
      beforeResume.basic?.location ?? "",
      optimizedResume.basic?.location ?? ""
    );
    pushText(
      "自我评价",
      beforeResume.selfEvaluationContent ?? "",
      optimizedResume.selfEvaluationContent ?? ""
    );
    pushText(
      "专业技能",
      summarizeText(beforeResume.skillContent ?? ""),
      summarizeText(optimizedResume.skillContent ?? "")
    );
    pushCount("教育经历数量", beforeResume.education?.length, optimizedResume.education?.length);
    pushCount("工作经历数量", beforeResume.experience?.length, optimizedResume.experience?.length);
    pushCount("项目经历数量", beforeResume.projects?.length, optimizedResume.projects?.length);

    return items;
  }, [activeResume, optimizedResume, sourceResume]);

  const handleGenerate = async () => {
    if (!activeResume) {
      toast.error("请先打开一份简历");
      return;
    }

    if (!aiConfig.isConfigured()) {
      toast.error("请先到 AI 服务商页面配置 API Key");
      router.push("/app/dashboard/ai");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("先填写岗位需求");
      return;
    }

    const apiKey = selectedApiKey;
    const model = selectedModel;

    if (!apiKey || !model) {
      toast.error("当前 AI 配置不可用");
      return;
    }

    setIsGenerating(true);
    setMessage("");
    setOptimizedResume(null);
    setSourceResume(structuredClone(activeResume));
    setHasApplied(false);

    try {
      const response = await fetch("/api/resume-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "optimize",
          resume: activeResume,
          jobDescription: jobDescription.trim(),
          instruction: instruction.trim(),
          apiKey,
          model,
          modelType: aiConfig.selectedModel,
          apiEndpoint:
            aiConfig.selectedModel === "openai"
              ? aiConfig.openaiApiEndpoint
              : undefined,
          locale:
            typeof document !== "undefined" &&
            document.cookie.includes("NEXT_LOCALE=en")
              ? "en"
              : "zh",
        }),
      });

      const raw = await response.text();
      let data: (ResumeAgentResponse & { error?: string }) | null = null;

      try {
        data = JSON.parse(raw) as ResumeAgentResponse & { error?: string };
      } catch {
        const snippet = raw.trim().slice(0, 180);
        throw new Error(
          snippet
            ? `智能体接口返回了非 JSON 内容：${snippet}`
            : "智能体接口返回了空响应"
        );
      }

      if (!response.ok) {
        throw new Error(data?.error || "简历优化失败");
      }

      setMessage(data.message || "简历已优化完成");
      setOptimizedResume(data.optimizedResume);
      toast.success("AI 已生成优化结果");
    } catch (error) {
      console.error("Resume agent error:", error);
      toast.error(error instanceof Error ? error.message : "简历优化失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!activeResume || !optimizedResume) return;

    const beforeResume = sourceResume || activeResume;
    const highlightKeywords = getChangedPreviewKeywords(
      beforeResume,
      optimizedResume
    );
    const highlightPaths = getChangedPreviewPaths(
        beforeResume,
        optimizedResume
    );

    updateResume(activeResume.id, optimizedResume);
    setHasApplied(true);
    toast.success("优化结果已应用到当前简历");

    window.setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent("resume-agent-highlight-changes", {
          detail: {
            keywords: highlightKeywords,
            paths: highlightPaths,
          },
        })
      );
    }, 250);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setMessage("");
      setOptimizedResume(null);
      setSourceResume(null);
      setHasApplied(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] p-0">
        <div className="flex h-full flex-col">
          <div className="border-b px-6 py-5">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                简历智能优化
              </SheetTitle>
              <SheetDescription>
                输入岗位需求和修改要求，让 AI 先生成一版简历草稿，再手动应用。
              </SheetDescription>
            </SheetHeader>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="agent-job-description">岗位需求</Label>
                <Textarea
                  id="agent-job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="贴入岗位 JD、招聘描述或面试要求"
                  className="min-h-[180px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-instruction">修改要求</Label>
                <Textarea
                  id="agent-instruction"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="例如：突出大模型项目经验，弱化偏后端的内容，标题改成 AI 应用工程师"
                  className="min-h-[110px]"
                />
              </div>

              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                当前模型：
                <span className="ml-2 font-medium text-foreground">
                  {aiConfig.selectedModel}
                </span>
                <div className="mt-1 break-all">
                  {activeResume ? getResumeSummary(activeResume) : "暂无当前简历"}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中
                    </>
                  ) : (
                    <>
                      <WandSparkles className="mr-2 h-4 w-4" />
                      生成优化草稿
                    </>
                  )}
                </Button>
              </div>

              {message || optimizedResume ? (
                <>
                  <Separator />

                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Check className="h-4 w-4 text-emerald-500" />
                        {hasApplied
                          ? "优化结果已应用到当前简历"
                          : message || "AI 已完成优化"}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {hasApplied
                          ? "右侧预览已经更新，下面仍保留本次修改前后的差异。"
                          : optimizedResume?.title || "未返回标题"}
                      </div>
                    </div>

                    {optimizedResume && (
                      <div className="space-y-3">
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-lg border p-3">
                          <div className="text-muted-foreground">姓名</div>
                          <div className="font-medium">
                            {optimizedResume.basic?.name || "未识别"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-muted-foreground">职位</div>
                          <div className="font-medium">
                            {optimizedResume.basic?.title || "未识别"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-muted-foreground">项目数量</div>
                          <div className="font-medium">
                            {optimizedResume.projects?.length || 0}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-muted-foreground">工作经历</div>
                          <div className="font-medium">
                            {optimizedResume.experience?.length || 0}
                          </div>
                        </div>
                        </div>

                        <div className="rounded-lg border bg-muted/10 p-4">
                          <div className="mb-1 text-sm font-medium">
                            {hasApplied ? "本次已应用修改" : "修改摘要"}
                          </div>
                          <div className="mb-3 text-xs text-muted-foreground">
                            红色是修改前，绿色是应用后的内容。关闭面板后，本次对比记录会清空。
                          </div>
                          <div className="space-y-3">
                            {changeItems.length > 0 ? (
                              changeItems.map((item) => (
                                <div
                                  key={`${item.label}-${item.before}-${item.after}`}
                                  className="rounded-md border bg-background p-3 text-sm"
                                >
                                  <div className="mb-2 font-medium text-foreground">
                                    {item.label}
                                  </div>
                                  <div className="grid gap-2 text-muted-foreground">
                                    <div className="rounded bg-rose-50 px-2 py-1 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                                      原：{item.before}
                                    </div>
                                    <div className="rounded bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                      新：{item.after}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
                                本次优化没有检测到可见差异。
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onOpenChange(false)}
                      >
                        关闭
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleApply}
                        disabled={!optimizedResume || hasApplied}
                      >
                        {hasApplied ? "已应用到当前简历" : "应用到当前简历"}
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
