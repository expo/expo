import fs from 'node:fs';
import path from 'node:path';

import type { Feature } from './features';
import type { NativePlatform } from './prompts';

const asyncFunctionPattern = /(?:^|\s)AsyncFunction\s*\(/;
const functionPattern = /(?:^|\s)Function\s*\(/;
const eventsPattern = /(?:^|\s)Events\s*\(/;
const classPattern = /(?:^|\s)Class\s*\(/;
const classNamePattern = /Class\s*\((\w+)(?:\.self|::class)/;
// Swift form: `ExpoUIView(<Name>.self)`. Excludes Kotlin's generic form `ExpoUIView<...>(`.
const swiftUIViewPattern = /(?:^|\s)ExpoUIView\s*\(/;
// Kotlin form: `ExpoUIView<Props>("Name") { ... }`.
const composeViewPattern = /(?:^|\s)ExpoUIView\s*</;
const swiftUIModifierPattern = /ViewModifierRegistry\s*\.\s*register\s*\(/;
// Word boundary excludes `ViewModifierRegistry.register` from matching here.
const composeModifierPattern = /\bModifierRegistry\s*\.\s*register\s*\(/;
// An `@JS` member: the attributes and modifiers before its declaration keyword, the keyword, and
// the rest of the declaration up to its body or the next `@JS` member.
const jsMemberPattern =
  /@JS\b(?:\([^)]*\))?(?:\s+(?:@\w+(?:\([^)]*\))?|[a-z]+))*?\s+(suspend\s+fun|func|fun|let|val|var)\b((?:(?!@JS\b)[^{])*)/g;
// The `async` effect after the parameters of a Swift function.
const swiftAsyncPattern = /\)\s*async\b/;
const eventPropertyPattern = /@Event\b/;
// The `@ExpoModule` attribute and the name of the class it is on.
const expoModulePattern = /@ExpoModule\b(?:\s*\([^)]*\))?[\s\S]*?\b(?:class|object)\s+(\w+)/;
const expoModuleArgumentsPattern = /@ExpoModule\s*\(([^)]*)\)/;
// In the `@ExpoModule` arguments: the JS name as the first argument, or as the Kotlin `name`
// argument in any position.
const moduleNamePattern = /^\s*"([^"]*)"|\bname\s*=\s*"([^"]*)"/;
// In the `@ExpoModule` arguments: the first class of `classes`.
const moduleClassesPattern = /\bclasses\s*[:=]\s*\[\s*(\w+)(?:\.self|::class)/;

// A comment, or a string literal, which is kept so that `/*` and `//` in it don't start a comment.
const stringOrCommentPattern = /("(?:\\.|[^"\\\n])*")|\/\*[\s\S]*?\*\/|\/\/.*$/gm;

const IGNORED_SEARCH_DIRS = new Set(['build', 'Pods', '.gradle', 'node_modules', 'DerivedData']);

export type DetectedFeatures = {
  features: Feature[];
  /**
   * Class name extracted from `Class(Name.self)`, `Class(Name::class)` or the `classes` of an
   * `@ExpoModule` annotation, or null.
   */
  sharedObjectName: string | null;
};

/**
 * Parses module definition content to detect features.
 */
export function detectFeaturesFromContent(content: string): DetectedFeatures {
  const lines = stripComments(content).split('\n');
  const features = new Set<Feature>();
  let sharedObjectName: string | null = null;

  type ViewBlockState = 'NOT_IN_VIEW' | 'WAITING_FOR_OPEN' | 'IN_VIEW';

  let braceDepth = 0;
  let viewBlockState: ViewBlockState = 'NOT_IN_VIEW';
  let viewBlockEntryBraceDepth = -1; // braceDepth when View block { was seen

  for (const line of lines) {
    const stripped = line.trim();
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

    // Compose check before SwiftUI: `ExpoUIView<` should not also fall through
    // to the SwiftUI pattern (which matches `ExpoUIView(`).
    if (composeViewPattern.test(stripped)) {
      features.add('ComposeView');
    } else if (swiftUIViewPattern.test(stripped)) {
      features.add('SwiftUIView');
    }

    // SwiftUI check before Compose: avoid `ViewModifierRegistry.register`
    // matching the more general `ModifierRegistry.register` pattern.
    if (swiftUIModifierPattern.test(stripped)) {
      features.add('SwiftUIModifier');
    } else if (composeModifierPattern.test(stripped)) {
      features.add('ComposeModifier');
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
 * Parses an Expo Modules API 2.0 module class to detect which features it uses.
 */
export function detectV2FeaturesFromContent(content: string): DetectedFeatures {
  const code = stripComments(content);
  const features = new Set<Feature>();
  for (const [, keyword, declaration] of code.matchAll(jsMemberPattern)) {
    if (keyword === 'let' || keyword === 'val') {
      features.add('Constant');
    } else if (
      keyword?.startsWith('suspend') ||
      (keyword === 'func' && swiftAsyncPattern.test(declaration ?? ''))
    ) {
      features.add('AsyncFunction');
    } else if (keyword === 'func' || keyword === 'fun') {
      features.add('Function');
    }
  }
  if (eventPropertyPattern.test(code)) {
    features.add('Event');
  }
  const sharedObjectName = getExpoModuleArguments(code).match(moduleClassesPattern)?.[1] ?? null;
  if (sharedObjectName) {
    features.add('SharedObject');
  }
  return { features: Array.from(features), sharedObjectName };
}

export type DetectedExpoModule = {
  /** The JS name, which defaults to the class name. */
  name: string;
  /** The class name. */
  moduleName: string;
};

/**
 * Parses the names of an Expo Modules API 2.0 module class, or returns null when the content has
 * no `@ExpoModule` class.
 */
export function detectExpoModuleFromContent(content: string): DetectedExpoModule | null {
  const code = stripComments(content);
  const moduleName = code.match(expoModulePattern)?.[1];
  if (!moduleName) {
    return null;
  }
  const nameMatch = getExpoModuleArguments(code).match(moduleNamePattern);
  return { name: nameMatch?.[1] || nameMatch?.[2] || moduleName, moduleName };
}

function getExpoModuleArguments(code: string): string {
  return code.match(expoModuleArgumentsPattern)?.[1] ?? '';
}

function stripComments(content: string): string {
  return content.replace(stringOrCommentPattern, (_match, literal?: string) => literal ?? '');
}

/**
 * Searches a module's platform directory for the file containing `ModuleDefinition`.
 * Returns the absolute path or null if not found.
 *
 * apple → scans ios/**\/*.swift
 * android → scans android/src/**\/*.kt
 */
export function findModuleDefinitionFile(
  moduleRoot: string,
  platform: NativePlatform
): Promise<string | null> {
  return findPlatformFileWithContent(moduleRoot, platform, (content) =>
    content.includes('ModuleDefinition')
  );
}

/**
 * Searches a module's platform directory for the file with an Expo Modules API 2.0 module class.
 * Returns the absolute path or null if not found.
 */
export function findExpoModuleFile(
  moduleRoot: string,
  platform: NativePlatform
): Promise<string | null> {
  return findPlatformFileWithContent(
    moduleRoot,
    platform,
    (content) => detectExpoModuleFromContent(content) !== null
  );
}

function findPlatformFileWithContent(
  moduleRoot: string,
  platform: NativePlatform,
  matches: (content: string) => boolean
): Promise<string | null> {
  const searchDir =
    platform === 'apple' ? path.join(moduleRoot, 'ios') : path.join(moduleRoot, 'android', 'src');

  const ext = platform === 'apple' ? '.swift' : '.kt';
  return findFileWithContent(searchDir, ext, matches);
}

async function findFileWithContent(
  dir: string,
  ext: string,
  matches: (content: string) => boolean
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
      const result = await findFileWithContent(fullPath, ext, matches);
      if (result) return result;
    } else if (entry.name.endsWith(ext)) {
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      if (matches(content)) return fullPath;
    }
  }
  return null;
}
