import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { cn } from "@/lib/utils";
import { useTemplateContext } from "../../TemplateContext";
import SectionWrapper from "../../shared/SectionWrapper";
import { GlobalSettings } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";

interface SelfEvaluationSectionProps {
    content?: string;
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
}

const SelfEvaluationSection = ({ content, globalSettings, showTitle = true }: SelfEvaluationSectionProps) => {
    const templateContext = useTemplateContext();

    const highlightClass = templateContext?.isHighlighted("selfEvaluationContent")
        ? "resume-agent-field-highlight"
        : "";
    return (
        <SectionWrapper sectionId="selfEvaluation" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="selfEvaluation" globalSettings={globalSettings} showTitle={showTitle} />
            <motion.div style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                <motion.div
                    className={cn("text-baseFont", highlightClass)} layout="position"
                    style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                    dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(content) }}
                />
            </motion.div>
        </SectionWrapper>
    );
};

export default SelfEvaluationSection;
