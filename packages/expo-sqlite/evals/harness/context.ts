import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import type { Condition, EvalContext, GrepMatch, SourceFile, TypecheckResult } from './types';

const execFileAsync = promisify(execFile);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

export function createEvalContext(workspace: string, condition: Condition): EvalContext {
  let cachedSources: SourceFile[] | null = null;

  const read = (relativePath: string): string => {
    try {
      return fs.readFileSync(path.join(workspace, relativePath), 'utf8');
    } catch {
      return '';
    }
  };

  const sourceFiles = (): SourceFile[] => {
    if (!cachedSources) {
      cachedSources = collectSourceFiles(workspace);
    }
    return cachedSources;
  };

  return {
    workspace,
    condition,
    read,
    exists: (relativePath) => fs.existsSync(path.join(workspace, relativePath)),
    sourceFiles,
    grep: (pattern) => grepSources(sourceFiles(), pattern),
    packageJson: () => {
      const raw = read('package.json');
      if (!raw) {
        return undefined;
      }
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    },
    typecheck: () => typecheckAsync(workspace),
  };
}

function collectSourceFiles(workspace: string): SourceFile[] {
  const results: SourceFile[] = [];
  const visit = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        results.push({
          path: path.relative(workspace, absolutePath),
          contents: fs.readFileSync(absolutePath, 'utf8'),
        });
      }
    }
  };
  visit(workspace);
  return results;
}

function grepSources(sources: SourceFile[], pattern: RegExp): GrepMatch[] {
  const matches: GrepMatch[] = [];
  for (const file of sources) {
    const lines = file.contents.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // Recreate stateful regexes per line so the `g` flag cannot skip matches.
      const linePattern = new RegExp(pattern.source, pattern.flags.replace('g', ''));
      if (linePattern.test(lines[i])) {
        matches.push({ path: file.path, line: i + 1, text: lines[i].trim() });
      }
    }
  }
  return matches;
}

async function typecheckAsync(workspace: string): Promise<TypecheckResult> {
  if (!fs.existsSync(path.join(workspace, 'node_modules'))) {
    return {
      status: 'unavailable',
      output: 'node_modules is missing — run the harness with --install to enable typechecking.',
    };
  }
  try {
    await execFileAsync('npx', ['tsc', '--noEmit'], { cwd: workspace, timeout: 120_000 });
    return { status: 'passed', output: '' };
  } catch (error: any) {
    return { status: 'failed', output: String(error?.stdout ?? error).slice(0, 4000) };
  }
}
