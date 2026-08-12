import fs from 'fs';
import path from 'path';

import type { Condition, EvalWorkspace } from './types';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

export function createWorkspace(root: string, condition: Condition): EvalWorkspace {
  let cachedSources: { path: string; contents: string }[] | null = null;
  const sourceFiles = () => {
    if (!cachedSources) {
      const sources: { path: string; contents: string }[] = [];
      const visit = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
            continue;
          }
          const absolutePath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            visit(absolutePath);
          } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
            sources.push({
              path: path.relative(root, absolutePath),
              contents: fs.readFileSync(absolutePath, 'utf8'),
            });
          }
        }
      };
      visit(root);
      cachedSources = sources;
    }
    return cachedSources;
  };

  return {
    root,
    condition,
    read: (relativePath) => {
      try {
        return fs.readFileSync(path.join(root, relativePath), 'utf8');
      } catch {
        return '';
      }
    },
    exists: (relativePath) => fs.existsSync(path.join(root, relativePath)),
    sourceFiles,
    source: () =>
      sourceFiles()
        .map((f) => stripComments(f.contents))
        .join('\n'),
    packageJson: () => {
      try {
        return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      } catch {
        return undefined;
      }
    },
    glob: (pattern) =>
      fs
        .globSync(pattern, { cwd: root })
        .filter(
          (match) =>
            !match.split(path.sep).some((part) => part === 'node_modules' || part.startsWith('.'))
        )
        .sort(),
  };
}

/**
 * Strips // and /* *\/ comments while leaving string and template contents
 * intact, so lexical checks scan only live code. Mirrors the comment-stripped
 * scan the expo eval-experiments harness runs its lexical checks on.
 */
export function stripComments(code: string): string {
  let result = '';
  let state: 'code' | 'line' | 'block' | 'single' | 'double' | 'template' = 'code';
  for (let i = 0; i < code.length; i++) {
    const pair = code.slice(i, i + 2);
    const char = code.charAt(i);
    switch (state) {
      case 'code':
        if (pair === '//') {
          state = 'line';
          i++;
        } else if (pair === '/*') {
          state = 'block';
          i++;
        } else {
          if (char === "'") state = 'single';
          else if (char === '"') state = 'double';
          else if (char === '`') state = 'template';
          result += char;
        }
        break;
      case 'line':
        if (char === '\n') {
          state = 'code';
          result += char;
        }
        break;
      case 'block':
        if (pair === '*/') {
          state = 'code';
          i++;
        } else if (char === '\n') {
          result += char;
        }
        break;
      case 'single':
      case 'double':
      case 'template': {
        result += char;
        const terminator = state === 'single' ? "'" : state === 'double' ? '"' : '`';
        if (char === '\\') {
          result += code.charAt(++i);
        } else if (char === terminator || (state !== 'template' && char === '\n')) {
          state = 'code';
        }
        break;
      }
    }
  }
  return result;
}
