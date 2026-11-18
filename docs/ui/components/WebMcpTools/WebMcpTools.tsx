import { useEffect } from 'react';

import { webMcpTools, type WebMcpTool } from './tools';

type ModelContext = {
  registerTool: (tool: WebMcpTool, options: { signal: AbortSignal }) => Promise<void>;
};

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!modelContext) {
      return;
    }

    const controller = new AbortController();
    for (const tool of webMcpTools) {
      modelContext.registerTool(tool, { signal: controller.signal }).catch(error => {
        if (!controller.signal.aborted) {
          console.error(`Unable to register the WebMCP tool ${tool.name}`, error);
        }
      });
    }
    return () => {
      controller.abort();
    };
  }, []);

  return null;
}
