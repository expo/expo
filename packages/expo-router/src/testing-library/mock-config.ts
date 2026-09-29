import path from 'path';

import { getNavigationConfig } from '../getLinkingConfig';
import { getExactRoutes } from '../getRoutes';
import type { InMemoryContextOptions, MemoryContext } from './context-stubs';
import { inMemoryContext, requireContext, requireContextWithOverrides } from './context-stubs';

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
  return getNavigationConfig(getExactRoutes(getMockContext(context))!, metaOnly, {
    sitemap: true,
    notFound: true,
  });
}

export function getMockContext(context: MockContextConfig, options: InMemoryContextOptions = {}) {
  if (typeof context === 'string') {
    assertNotLazy(options);
    return requireContext(path.resolve(process.cwd(), context));
  } else if (Array.isArray(context)) {
    return inMemoryContext(
      Object.fromEntries(context.map((filename) => [filename, { default: () => null }])),
      options
    );
  } else if (!('appDir' in context)) {
    return inMemoryContext(context, options);
  } else if ('appDir' in context && typeof context.appDir === 'string') {
    assertNotLazy(options);
    return requireContextWithOverrides(context.appDir, context.overrides as MemoryContext);
  } else {
    throw new Error('Invalid context');
  }
}

function assertNotLazy(options: InMemoryContextOptions) {
  if (options.lazy) {
    throw new Error(
      'The lazy import mode is only supported for in-memory contexts. Pass the routes as an object or an array of file names instead of a directory.'
    );
  }
}
