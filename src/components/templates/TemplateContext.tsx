import React, { createContext, useContext } from "react";
import { MenuSection } from "@/types/resume";

interface TemplateContextProps {
  templateId: string;
  menuSections: MenuSection[];
  highlightPaths?: string[];
  isHighlighted: (path: string) => boolean;
}

const TemplateContext = createContext<TemplateContextProps | undefined>(undefined);

export const TemplateProvider: React.FC<{
  templateId: string;
  menuSections: MenuSection[];
  highlightPaths?: string[];
  children: React.ReactNode;
}> = ({ templateId, menuSections, highlightPaths = [], children }) => {
  const isHighlighted = (path: string) => highlightPaths.includes(path);

  return (
      <TemplateContext.Provider value={{ templateId, menuSections, highlightPaths, isHighlighted }}>
        {children}
      </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  return useContext(TemplateContext);
};
