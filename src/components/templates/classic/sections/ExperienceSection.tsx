import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Experience, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { normalizeRichTextContent } from "@/lib/richText";
import { cn, formatDateString } from "@/lib/utils";
import { useLocale } from "@/i18n/compat/client";
import { useTemplateContext } from "../../TemplateContext";

interface ExperienceSectionProps {
    experiences?: Experience[];
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experiences, globalSettings, showTitle = true }) => {
    const locale = useLocale();
    const templateContext = useTemplateContext();
    const highlightClass = (path: string) =>
        templateContext?.isHighlighted(path) ? "resume-agent-field-highlight" : "";
    const visibleExperiences = experiences
        ?.map((experience, index) => ({ experience, index }))
        .filter(({ experience }) => experience.visible);
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
        <SectionWrapper sectionId="experience" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="experience" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                {visibleExperiences?.map(({ experience: exp, index }) => (
                    <motion.div key={exp.id} layout="position" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                        <motion.div className="flex items-center gap-2">
                            <div className={cn("font-bold", flexLayout ? "" : "flex-[1.5]", highlightClass(`experience.${index}.company`))} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                {exp.company}
                            </div>
                            {centerSubtitle && (
                                <motion.div className={cn("text-subtitleFont", flexLayout ? "ml-[16px]" : "flex-1", highlightClass(`experience.${index}.position`))} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {exp.position}
                                </motion.div>
                            )}
                            <div className={cn("text-subtitleFont shrink-0", flexLayout ? "ml-auto" : "flex-1 text-right", highlightClass(`experience.${index}.date`))} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                {formatDateString(exp.date, locale)}
                            </div>
                        </motion.div>
                        {exp.position && !centerSubtitle && (
                            <motion.div className={cn("text-subtitleFont", highlightClass(`experience.${index}.position`))} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{exp.position}</motion.div>
                        )}
                        {exp.details && (
                            <motion.div className={cn("mt-1 text-baseFont", highlightClass(`experience.${index}.details`))} dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(exp.details) }}
                                style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                            />
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </SectionWrapper>
    );
};

export default ExperienceSection;
