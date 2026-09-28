import { useEffect, useRef } from 'react';

import type { ModelContextTool } from './ModelContext.types';
import { modelContext } from './modelContext';

/**
 * Register a tool for the lifetime of the component. The tool unregisters on unmount.
 *
 * The latest `execute` is always used, so `deps` can stay small. Pass `deps` to re-register
 * when the description or schema changes.
 */
export function useModelContextTool<Input extends Record<string, unknown>>(
  tool: ModelContextTool<Input>,
  deps: readonly unknown[] = [tool.name]
): void {
  const toolRef = useRef(tool);
  toolRef.current = tool;

  useEffect(() => {
    const subscription = modelContext.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: (input, options) => toolRef.current.execute(input as Input, options),
    });
    return () => subscription.remove();
  }, deps);
}
