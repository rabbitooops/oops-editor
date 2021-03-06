import React, { useMemo, createContext } from "react";
import { DocType, DocConfigs } from "../types";
import { AbstractNode, AnyAbstractNode } from "../AbstractNode";

interface DocumentContext {
  configs: DocConfigs;
}

const EmptyDocConfig = {
  View: function EmptyView() {
    return null;
  },
};

export const documentContext = createContext<DocumentContext>({
  configs: {
    [DocType.Doc]: EmptyDocConfig,
    [DocType.List]: EmptyDocConfig,
    [DocType.ListItem]: EmptyDocConfig,
    [DocType.Paragraph]: EmptyDocConfig,
    [DocType.Text]: EmptyDocConfig,
  },
});

interface DocumentProps {
  root: AnyAbstractNode;
  configs: DocConfigs;
}

export function EditorDocument({
  root,
  configs,
}: DocumentProps) {
  const value = useMemo<DocumentContext>(() => ({
    configs,
  }), [configs]);
  const type = root.type;
  const RootView = configs[type].View;

  return (
    <documentContext.Provider value={value}>
      <RootView key={root.id} context={root}  />
    </documentContext.Provider>
  );
}
