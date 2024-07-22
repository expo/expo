import path from 'path';

import {
  MemoryContext,
  inMemoryContext,
  requireContext,
  requireContextWithOverrides,
} from './context-stubs';
import { getNavigationConfig } from '../getLinkingConfig';
import { getExactRoutes } from '../getRoutes';

export type MockContextConfig =
  | string // Pathname to a directory
  | string[] // Array of filenames to mock as empty components, e.g () => null
  | MemoryContext // Map of filenames and their exports
  | {
      // Directory to load as context
      appDir: string;
      // Map of filenames and their exports. Will override contents of files loaded in `appDir
      overrides: MemoryContext;
    };

export function getMockConfig(context: MockContextConfig, metaOnly: boolean = true) {
  return getNavigationConfig(getExactRoutes(getMockContext(context))!, metaOnly);
}

export function getMockContext(context: MockContextConfig) {
  if (typeof context === 'string') {
    return requireContext(path.resolve(process.cwd(), context));
  } else if (Array.isArray(context)) {
    return inMemoryContext(
      Object.fromEntries(context.map((filename) => [filename, { default: () => null }]))
    );
  } else if (!('appDir' in context)) {
    return inMemoryContext(context);
  } else if ('appDir' in context && typeof context.appDir === 'string') {
    return requireContextWithOverrides(context.appDir, context.overrides as MemoryContext);
  } else {
    throw new Error('Invalid context');
  }
}
