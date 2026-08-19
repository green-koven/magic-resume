import { AnimatePresence, motion } from "framer-motion";
import { Education, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { useLocale } from "@/i18n/compat/client";
import { hasMeaningfulRichTextContent, normalizeRichTextContent } from "@/lib/richText";
import { cn, formatDateRange } from "@/lib/utils";
import { useTemplateContext } from "../../TemplateContext";

interface EducationSectionProps {
    education?: Education[];
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
}

const EducationSection = ({ education, globalSettings, showTitle = true }: EducationSectionProps) => {
    const locale = useLocale();
    const templateContext = useTemplateContext();
    const highlightClass = (path: string) =>
        templateContext?.isHighlighted(path) ? "resume-agent-field-highlight" : "";
    const visibleEducation = education
        ?.map((edu, index) => ({ edu, index }))
        .filter(({ edu }) => edu.visible);
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
        <SectionWrapper sectionId="education" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="education" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                {visibleEducation?.map(({ edu, index }) => (
                    <motion.div key={edu.id} layout="position" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                        <motion.div layout="position" className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "font-bold",
                                    flexLayout ? "" : "flex-[1.5]",
                                    highlightClass(`education.${index}.school`)
                                )}
                                style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}
                            >
                                {edu.school}
                            </div>
                            {centerSubtitle && (
                                <motion.div
                                    layout="position"
                                    className={cn(
                                        "text-subtitleFont",
                                        flexLayout ? "ml-[16px]" : "flex-1",
                                        highlightClass(`education.${index}.major`),
                                        highlightClass(`education.${index}.degree`),
                                        highlightClass(`education.${index}.gpa`)
                                    )}
                                    style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}
                                >
                                    {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                                    {edu.gpa && ` · GPA ${edu.gpa}`}
                                </motion.div>
                            )}
                            <span
                                className={cn(
                                    "text-subtitleFont shrink-0",
                                    flexLayout ? "ml-auto" : "flex-1 text-right",
                                    highlightClass(`education.${index}.date`)
                                )}
                                suppressHydrationWarning
                                style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}
                            >
                                {formatDateRange(edu.startDate, edu.endDate, locale)}
                            </span>
                        </motion.div>
                        {!centerSubtitle && (
                            <motion.div
                                layout="position"
                                className={cn(
                                    "text-subtitleFont",
                                    flexLayout ? "ml-[16px]" : "flex-1",
                                    highlightClass(`education.${index}.major`),
                                    highlightClass(`education.${index}.degree`),
                                    highlightClass(`education.${index}.gpa`)
                                )}
                            >
                                {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                                {edu.gpa && ` · GPA ${edu.gpa}`}
                            </motion.div>
                        )}
                        {hasMeaningfulRichTextContent(edu.description) && (
                            <motion.div
                                layout="position"
                                className={cn(
                                    "mt-1 text-baseFont",
                                    highlightClass(`education.${index}.description`)
                                )}
                                style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                                dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(edu.description) }}
                            />
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </SectionWrapper>
    );
};

export default EducationSection;
