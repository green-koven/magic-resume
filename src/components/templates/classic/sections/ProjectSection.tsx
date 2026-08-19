import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { Project, GlobalSettings } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";
import { cn, formatDateString } from "@/lib/utils";
import { useTemplateContext } from "../../TemplateContext";
import { useLocale } from "@/i18n/compat/client";
import { getProjectLinkMeta } from "@/lib/projectLink";

interface ProjectSectionProps {
    projects: Project[];
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({ projects, globalSettings, showTitle = true }) => {
    const locale = useLocale();
    const templateContext = useTemplateContext();

    const highlightClass = (path: string) =>
        templateContext?.isHighlighted(path) ? "resume-agent-field-highlight" : "";
    const visibleProjects = projects
        ?.map((project, index) => ({ project, index }))
        .filter(({ project }) => project.visible);
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
        <SectionWrapper sectionId="projects" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="projects" globalSettings={globalSettings} showTitle={showTitle} />
            <motion.div layout="position">
                <AnimatePresence mode="popLayout">
                    {visibleProjects.map(({ project, index }) => {
                        const projectLink = getProjectLinkMeta(project, {
                            preferFullUrl: centerSubtitle,
                        });

                        return (
                        <motion.div key={project.id} style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                            <motion.div className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 ${flexLayout ? "" : "flex-[1.5]"}`}>
                                    <h3
                                        className={cn("font-bold", highlightClass(`projects.${index}.name`))}
                                        style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}
                                    >
                                        {project.name}
                                    </h3>
                                </div>
                                {projectLink && !centerSubtitle && (
                                    <a href={projectLink.href} target="_blank" rel="noopener noreferrer"
                                        className={`underline ${flexLayout ? "" : "flex-1"}`} title={projectLink.title} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                        {projectLink.label}
                                    </a>
                                )}
                                {!projectLink && !centerSubtitle && !flexLayout && <div className="flex-1" />}
                                {centerSubtitle && (
                                    <motion.div layout="position" className={cn(
                                        "text-subtitleFont",
                                        flexLayout ? "ml-[16px]" : "flex-1",
                                        highlightClass(`projects.${index}.role`)
                                    )} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                        {project.role}
                                    </motion.div>
                                )}
                                <div className={cn(
                                    "text-subtitleFont shrink-0",
                                    flexLayout ? "ml-auto" : "flex-1 text-right",
                                    highlightClass(`projects.${index}.date`)
                                )} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {formatDateString(project.date, locale)}
                                </div>
                            </motion.div>
                            {project.role && !centerSubtitle && (
                                <motion.div
                                    layout="position"
                                    className={cn("text-subtitleFont", highlightClass(`projects.${index}.role`))}
                                    style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}
                                >
                                    {project.role}
                                </motion.div>
                            )}
                            {projectLink && centerSubtitle && (
                                <a href={projectLink.href} target="_blank" rel="noopener noreferrer" className="underline" title={projectLink.title} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{projectLink.label}</a>
                            )}
                            {project.description && (
                                <motion.div
                                    layout="position"
                                    className={cn("mt-1 text-baseFont", highlightClass(`projects.${index}.description`))}
                                    style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                                    dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(project.description) }}
                                />
                            )}
                        </motion.div>
                    )})}
                </AnimatePresence>
            </motion.div>
        </SectionWrapper>
    );
};

export default ProjectSection;
