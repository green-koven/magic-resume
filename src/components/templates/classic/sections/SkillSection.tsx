import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { GlobalSettings } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";
import { cn } from "@/lib/utils";
import { useTemplateContext } from "../../TemplateContext";

interface SkillSectionProps {
    skill?: string;
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
}

const SkillSection = ({ skill, globalSettings, showTitle = true }: SkillSectionProps) => {
    const templateContext = useTemplateContext();

    const highlightClass = templateContext?.isHighlighted("skillContent")
        ? "resume-agent-field-highlight"
        : "";
    return (
        <SectionWrapper sectionId="skills" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="skills" globalSettings={globalSettings} showTitle={showTitle} />
            <motion.div style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                <motion.div
                    className={cn("text-baseFont", highlightClass)}
                    layout="position"
                    style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                    dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(skill) }}
                />
            </motion.div>
        </SectionWrapper>
    );
};

export default SkillSection;
