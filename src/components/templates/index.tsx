import React from "react";
import { TemplateProvider } from "./TemplateContext";
import { getTemplateComponent } from "./registry";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";

interface TemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
  highlightPaths?: string[];
}

const ResumeTemplateComponent: React.FC<TemplateProps> = ({
                                                            data,
                                                            template,
                                                            highlightPaths,
                                                          }) => {
  const TemplateComponent = getTemplateComponent(template.layout);

  return (
      <TemplateProvider
          templateId={template.id}
          menuSections={data.menuSections}
          highlightPaths={highlightPaths}
      >
      <TemplateComponent data={data} template={template} />
    </TemplateProvider>
  );
};

export default ResumeTemplateComponent;
