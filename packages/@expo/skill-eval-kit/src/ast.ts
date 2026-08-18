import { createRequire } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';

import type { EvalWorkspace } from './types';

export interface AstSupport {
  /** Parses TypeScript/JSX source into a Babel AST. */
  parse(code: string, filename: string): any;
  /** Depth-first walk over every node in the tree (plain recursion, no @babel/traverse). */
  walk(node: any, visit: (node: any) => void): void;
}

/**
 * Loads `@babel/parser` — a dependency of this package, so it resolves
 * wherever the kit is installed. When it doesn't (e.g. running the kit from
 * source in a checkout without node_modules), falls back to the workspace's
 * own node_modules: every Expo app has `@babel/parser` transitively via
 * babel-preset-expo, so a workspace prepared with an install step provides
 * it. Returns null when neither resolves — the calling check should `skip()`
 * (evidence unavailable must never read as compliance).
 */
export async function loadAstSupport(workspace?: EvalWorkspace): Promise<AstSupport | null> {
  let parser: any;
  try {
    parser = await import('@babel/parser');
  } catch {
    parser = workspace ? await importFromWorkspaceAsync(workspace.root, '@babel/parser') : null;
    if (!parser) {
      return null;
    }
  }
  const walk = (node: any, visit: (node: any) => void) => {
    if (!node || typeof node.type !== 'string') {
      return;
    }
    visit(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const item of value) walk(item, visit);
      } else if (value && typeof value === 'object') {
        walk(value, visit);
      }
    }
  };
  return {
    parse: (code, filename) =>
      parser.parse(code, {
        sourceType: 'module',
        sourceFilename: filename,
        plugins: ['typescript', 'jsx'],
      }),
    walk,
  };
}

/** Imports a module from a workspace's own node_modules, or null when absent. */
async function importFromWorkspaceAsync(root: string, specifier: string): Promise<any | null> {
  try {
    const require = createRequire(path.join(root, 'noop.js'));
    return await import(pathToFileURL(require.resolve(specifier)).href);
  } catch {
    return null;
  }
}
