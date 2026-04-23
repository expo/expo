import fs from 'node:fs';
import path from 'node:path';

import type { Feature } from './features';

const asyncFunctionPattern = /(?:^|\s)AsyncFunction\s*\(/;
const functionPattern = /(?:^|\s)Function\s*\(/;
const eventsPattern = /(?:^|\s)Events\s*\(/;
const classPattern = /(?:^|\s)Class\s*\(/;
const classNamePattern = /Class\s*\((\w+)(?:\.self|::class)/;
const IGNORED_SEARCH_DIRS = new Set(['build', 'Pods', '.gradle', 'node_modules', 'DerivedData']);

export type DetectedFeatures = {
  features: Feature[];
  /** Class name extracted from `Class(Name.self)` or `Class(Name::class)`, or null. */
  sharedObjectName: string | null;
};

/**
 * Reads a native module definition file and detects which Expo Modules API
 * features it uses.
 */
export async function detectFeaturesFromFile(filePath: string): Promise<DetectedFeatures> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return detectFeaturesFromContent(content);
}

/**
 * Parses module definition content to detect features.
 * Exported for unit testing.
 */
export function detectFeaturesFromContent(content: string): DetectedFeatures {
  const lines = content.split('\n');
  const features = new Set<Feature>();
  let sharedObjectName: string | null = null;

  type ViewBlockState = 'NOT_IN_VIEW' | 'WAITING_FOR_OPEN' | 'IN_VIEW';

  let braceDepth = 0;
  let viewBlockState: ViewBlockState = 'NOT_IN_VIEW';
  let viewBlockEntryBraceDepth = -1; // braceDepth when View block { was seen

  for (const line of lines) {
    // Strip inline comments and surrounding whitespace.
    const stripped = line.replace(/\/\/.*$/, '').trim();
    if (!stripped) continue;

    // The DSL uses `Constant("name") { ... }` (singular) per snippet templates.
    // Match only at statement position to avoid false positives.
    if (/(?:^|\s)Constant\s*\(/.test(stripped)) {
      features.add('Constant');
    }
    // AsyncFunction must be checked before Function to avoid false positives.
    if (asyncFunctionPattern.test(stripped)) {
      features.add('AsyncFunction');
    } else if (functionPattern.test(stripped)) {
      features.add('Function');
    }

    // Require View( to be at the start of a statement or preceded by whitespace
    // to avoid false positives from UIView(, NSView(, ScrollView(, etc.
    if (/(?:^|\s)View\s*\(/.test(stripped)) {
      features.add('View');
      viewBlockState = 'WAITING_FOR_OPEN';
    }

    if (eventsPattern.test(stripped)) {
      if (viewBlockState === 'IN_VIEW') {
        features.add('ViewEvent');
      } else {
        features.add('Event');
      }
    }

    if (classPattern.test(stripped)) {
      features.add('SharedObject');
      // Extract: Class(MyName.self) or Class(MyName::class)
      const match = stripped.match(classNamePattern);
      if (match?.[1]) {
        sharedObjectName = match[1];
      }
    }

    // ── Update brace depth ───────────────────────────────────────────────
    const opens = (stripped.match(/\{/g) ?? []).length;
    const closes = (stripped.match(/\}/g) ?? []).length;
    braceDepth += opens - closes;

    // Transition from WAITING_FOR_OPEN to IN_VIEW once we see a { on this line.
    if (viewBlockState === 'WAITING_FOR_OPEN' && opens > 0) {
      viewBlockState = 'IN_VIEW';
      viewBlockEntryBraceDepth = braceDepth;
    }

    // Exit view block when depth drops below where it was when the block opened.
    if (viewBlockState === 'IN_VIEW' && braceDepth < viewBlockEntryBraceDepth) {
      viewBlockState = 'NOT_IN_VIEW';
      viewBlockEntryBraceDepth = -1;
    }
  }

  return { features: Array.from(features), sharedObjectName };
}

/**
 * Searches a module's platform directory for the file containing `ModuleDefinition`.
 * Returns the absolute path or null if not found.
 *
 * apple → scans ios/**\/*.swift
 * android → scans android/src/**\/*.kt
 */
export async function findModuleDefinitionFile(
  moduleRoot: string,
  platform: 'apple' | 'android'
): Promise<string | null> {
  const searchDir =
    platform === 'apple' ? path.join(moduleRoot, 'ios') : path.join(moduleRoot, 'android', 'src');

  const ext = platform === 'apple' ? '.swift' : '.kt';
  return findFileWithContent(searchDir, ext, 'ModuleDefinition');
}

async function findFileWithContent(
  dir: string,
  ext: string,
  needle: string
): Promise<string | null> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_SEARCH_DIRS.has(entry.name)) {
        continue;
      }
      const result = await findFileWithContent(fullPath, ext, needle);
      if (result) return result;
    } else if (entry.name.endsWith(ext)) {
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      if (content.includes(needle)) return fullPath;
    }
  }
  return null;
}
