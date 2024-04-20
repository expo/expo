import path from 'path';

import {
  FileStub,
  inMemoryContext,
  requireContext,
  requireContextWithOverrides,
} from './context-stubs';
import { getNavigationConfig } from '../getLinkingConfig';
import { getExactRoutes } from '../getRoutes';

function isOverrideContext(
  context: object
): context is { appDir: string; overrides: Record<string, FileStub> } {
  return Boolean(typeof context === 'object' && 'appDir' in context);
}

export type MockContextConfig =
  | string // Pathname to a directory
  | string[] // Array of filenames to mock as empty components, e.g () => null
  | Record<string, FileStub> // Map of filenames and their exports
  | {
      // Directory to load as context
      appDir: string;
      // Map of filenames and their exports. Will override contents of files loaded in `appDir
      overrides: Record<string, FileStub>;
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
  } else if (isOverrideContext(context)) {
    return requireContextWithOverrides(context.appDir, context.overrides);
  } else {
    return inMemoryContext(context);
  }
}
