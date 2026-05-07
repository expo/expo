/**
 * Implements the `@docsInline` JSDoc tag for `et generate-docs-api-data`.
 *
 * Tag a shared base type (interface or type alias) with `@docsInline` and the
 * docs generator will:
 *
 * 1. Treat it as an inheritance "mixin" — its members get folded into every
 *    interface that `extends` it, instead of being rendered as a separate
 *    "Inherited Props" pointer to a non-existent docs page.
 * 2. Inline its resolved type wherever it is used as a property type, so a
 *    prop typed `UniversalAlignment` ends up showing `'start' | 'center' | 'end'`
 *    on the rendered page rather than a broken anchor link.
 * 3. Be omitted from the page's top-level entries even when an entry-point
 *    file re-exports it (so it doesn't render as its own section).
 *
 * Use this for shared base prop types and small enums that you don't want
 * documented on their own page. The single source of truth for the convention
 * lives next to the type itself, in its JSDoc.
 *
 * ## Callflow
 *
 * `applyDocsInline()` is invoked once per per-component JSON, after the main
 * TypeDoc pass has produced `jsonRoot`.
 *
 * ```text
 *               ┌────────────────────────────────────────────┐
 *               │     applyDocsInline(jsonRoot, options)     │
 *               └────────────────────────────────────────────┘
 *                                   │
 *                  ┌────────────────┴────────────────┐
 *                  ▼                                 ▼
 *      ╔═══════════════════════╗       ╔══════════════════════════╗
 *      ║ Discovery             ║       ║ Resolution               ║
 *      ║                       ║       ║                          ║
 *      ║ findTaggedTypes()     ║       ║ collectTaggedDeclar...() ║
 *      ║ recursively scan src  ║       ║ side TypeDoc pass over   ║
 *      ║ via ts.getJSDocTags   ║       ║ each tagged source file  ║
 *      ║ ──► name → src path   ║       ║ ──► name → declaration   ║
 *      ╚═══════════════════════╝       ╚══════════════════════════╝
 *                  │                                 │
 *                  └────────────────┬────────────────┘
 *                                   ▼
 *               ┌────────────────────────────────────────────┐
 *               │ Mutate jsonRoot in four passes:            │
 *               │                                            │
 *               │ 1. inlineInheritedMembers     (extends)    │
 *               │    strip inheritedFrom + extendedTypes     │
 *               │                                            │
 *               │ 2. substituteTypeReferences   (prop type)  │
 *               │    {type:reference, T} → resolved type     │
 *               │    (recursive — handles transitive refs)   │
 *               │                                            │
 *               │ 3. suppressLeftoverReferences (stragglers) │
 *               │    {type:reference, T} → {intrinsic, T}    │
 *               │                                            │
 *               │ 4. removeTaggedFromTopLevel   (export *)   │
 *               │    drop entry if its name is tagged        │
 *               └────────────────────────────────────────────┘
 *                                   │
 *                                   ▼
 *                            jsonRoot mutated
 * ```
 *
 * Discovery and resolution are independent (no data dependency) and could run
 * in parallel; we keep them sequential for simpler reasoning. Both are cached
 * by source-dir / source-file-set, so subsequent calls within the same `gdad`
 * run are free.
 *
 * The four mutation passes run in a fixed order. Passes 1–3 can leave behind
 * partially-resolved nodes that the next pass cleans up — e.g. pass 2 may
 * substitute an interface as a synthesized TypeLiteral whose nested members
 * reference another tagged type, which pass 2's recursive descent itself
 * resolves; anything that still slips through is caught by pass 3.
 */

import fs from 'fs-extra';
import path from 'node:path';
import {
  Application,
  Configuration,
  ReflectionKind,
  TSConfigReader,
  TypeDocReader,
  type JSONOutput,
  type TypeDocOptions,
} from 'typedoc';
import * as ts from 'typescript';

export const DOCS_INLINE_TAG = '@docsInline';
const DOCS_INLINE_TAG_NAME = DOCS_INLINE_TAG.slice(1); // 'docsInline'

export interface ApplyDocsInlineOptions {
  /** Absolute path to the package's `src/` directory. Scanned for `@docsInline` tags. */
  packageSrcDir: string;
  /** Absolute path to the package's `tsconfig.json` (used by the side TypeDoc pass). */
  tsConfigPath: string;
}

/**
 * Mutates `jsonRoot` (a TypeDoc serialized project) to apply the `@docsInline`
 * rewrites. No-op if the package source has no tagged types.
 */
export async function applyDocsInline(
  jsonRoot: JSONOutput.ProjectReflection,
  options: ApplyDocsInlineOptions
): Promise<void> {
  const tagMap = await findTaggedTypes(options.packageSrcDir);
  if (tagMap.size === 0) return;

  const taggedNames = new Set(tagMap.keys());
  const declMap = await collectTaggedDeclarations(
    [...new Set(tagMap.values())],
    taggedNames,
    options.tsConfigPath
  );

  inlineInheritedMembers(jsonRoot, taggedNames);
  substituteTypeReferences(jsonRoot, declMap);
  suppressLeftoverReferences(jsonRoot, taggedNames);
  removeTaggedFromTopLevel(jsonRoot, taggedNames);
}

// ---------------------------------------------------------------------------
// Source discovery
// ---------------------------------------------------------------------------

const taggedTypesCache = new Map<string, Map<string, string>>();

/**
 * Recursively scans `packageSrcDir` and returns `tagged type name → source
 * file` for every interface/type alias whose JSDoc carries `@docsInline`.
 *
 * We scan source files directly (instead of the generated JSON) because each
 * per-component JSON only references the shared base type without
 * re-declaring it, so the tag isn't visible there.
 */
async function findTaggedTypes(packageSrcDir: string): Promise<Map<string, string>> {
  const cached = taggedTypesCache.get(packageSrcDir);
  if (cached) return cached;

  const found = new Map<string, string>();
  if (await fs.pathExists(packageSrcDir)) {
    await scanForTaggedTypes(packageSrcDir, found);
  }
  taggedTypesCache.set(packageSrcDir, found);
  return found;
}

async function scanForTaggedTypes(dir: string, found: Map<string, string>): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'build') continue;
      await scanForTaggedTypes(entryPath, found);
      continue;
    }
    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) continue;
    const content = await fs.readFile(entryPath, 'utf8');
    // Cheap pre-filter so we only parse files that actually mention the tag.
    if (!content.includes(DOCS_INLINE_TAG)) continue;
    for (const name of findTaggedNamesInSource(content)) {
      found.set(name, entryPath);
    }
  }
}

/**
 * AST-based extractor: returns the names of every `interface X` /
 * `type X = …` declaration whose JSDoc has a `@docsInline` tag.
 *
 * @internal Exported for testing.
 */
export function findTaggedNamesInSource(sourceText: string): string[] {
  const sourceFile = ts.createSourceFile(
    '__docs-inline-scan__.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true
  );
  const names: string[] = [];
  function visit(node: ts.Node) {
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      ts.getJSDocTags(node).some((tag) => tag.tagName.text === DOCS_INLINE_TAG_NAME)
    ) {
      names.push(node.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return names;
}

// ---------------------------------------------------------------------------
// Side TypeDoc pass for resolved declarations
// ---------------------------------------------------------------------------

const taggedDeclCache = new Map<string, Map<string, JSONOutput.DeclarationReflection>>();

/**
 * Runs a side TypeDoc pass over the source files that declare tagged types
 * and pulls out their resolved declarations. We can't piggyback on the main
 * per-component pass because adding extra entry points there changes how
 * TypeDoc emits re-exports (it replaces them with `Reference` kinds), which
 * breaks downstream rendering.
 */
async function collectTaggedDeclarations(
  sourceFiles: string[],
  taggedTypes: Set<string>,
  tsConfigPath: string
): Promise<Map<string, JSONOutput.DeclarationReflection>> {
  if (sourceFiles.length === 0 || taggedTypes.size === 0) return new Map();

  const cacheKey = sourceFiles.slice().sort().join('|');
  const cached = taggedDeclCache.get(cacheKey);
  if (cached) return cached;

  const app = await Application.bootstrapWithPlugins(
    {
      entryPoints: sourceFiles,
      tsconfig: tsConfigPath,
      disableSources: true,
      hideGenerator: true,
      excludeExternals: true,
      blockTags: [
        ...Configuration.OptionDefaults.blockTags,
        DOCS_INLINE_TAG,
        '@alias',
        '@deprecated',
        '@docsMissing',
        '@header',
        '@hideType',
        '@needsAudit',
        '@platform',
      ],
    } as unknown as TypeDocOptions,
    [new TSConfigReader(), new TypeDocReader()]
  );
  const project = await app.convert();

  const result = new Map<string, JSONOutput.DeclarationReflection>();
  if (project) {
    const json = app.serializer.projectToObject(project, process.cwd()) as unknown;
    walk(json, (node) => {
      if (isObject(node) && typeof node.name === 'string' && taggedTypes.has(node.name)) {
        result.set(node.name, node as unknown as JSONOutput.DeclarationReflection);
      }
    });
  }

  taggedDeclCache.set(cacheKey, result);
  return result;
}

// ---------------------------------------------------------------------------
// Tree rewrites
// ---------------------------------------------------------------------------

/**
 * For every interface that `extends` a tagged type, strip the
 * `inheritedFrom` markers from inherited children (so they render as local
 * props) and remove the matching `extendedTypes` entry (so the
 * "Inherited Props" pointer disappears).
 *
 * @internal Exported for testing.
 */
export function inlineInheritedMembers(jsonRoot: unknown, taggedTypes: Set<string>): void {
  if (taggedTypes.size === 0) return;
  walk(jsonRoot, (node) => {
    if (!isObject(node)) return;
    if (!Array.isArray(node.children) || !Array.isArray(node.extendedTypes)) return;

    const matched = node.extendedTypes.some((et: any) =>
      taggedTypes.has(extendedTypeName(et) ?? '')
    );
    if (!matched) return;

    for (const child of node.children as any[]) {
      const parentName = child?.inheritedFrom?.name?.split('.')[0];
      if (parentName && taggedTypes.has(parentName)) {
        delete child.inheritedFrom;
      }
    }
    node.extendedTypes = (node.extendedTypes as any[]).filter(
      (et: any) => !taggedTypes.has(extendedTypeName(et) ?? '')
    );
    if ((node.extendedTypes as any[]).length === 0) {
      delete node.extendedTypes;
    }
  });
}

function extendedTypeName(et: any): string | undefined {
  return et?.name ?? et?.target?.qualifiedName;
}

/**
 * Replace `{type:"reference", name: T}` nodes with the resolved type from a
 * tagged declaration `T`. Recurses into the substituted subtree so transitive
 * references (e.g. `UniversalTextStyle.fontWeight: UniversalFontWeight`) are
 * resolved as well.
 *
 * @internal Exported for testing.
 */
export function substituteTypeReferences(
  jsonRoot: unknown,
  declMap: Map<string, JSONOutput.DeclarationReflection>
): void {
  if (declMap.size === 0) return;

  function recurse(node: unknown): void {
    if (Array.isArray(node)) {
      for (const item of node) recurse(item);
      return;
    }
    if (!isObject(node)) return;
    for (const key of Object.keys(node)) {
      const value = node[key];
      const replacement = resolveReference(value, declMap);
      if (replacement !== undefined) {
        node[key] = replacement;
        recurse(replacement);
      } else {
        recurse(value);
      }
    }
  }

  recurse(jsonRoot);
}

function resolveReference(
  value: unknown,
  declMap: Map<string, JSONOutput.DeclarationReflection>
): unknown {
  if (!isObject(value) || value.type !== 'reference' || typeof value.name !== 'string') {
    return undefined;
  }
  const decl = declMap.get(value.name) as any;
  if (!decl) return undefined;

  // Type alias: expose the resolved shape via `decl.type`.
  if (decl.type) {
    return structuredClone(decl.type);
  }
  // Interface: synthesize a TypeLiteral reflection from its members so the
  // renderer prints them like an anonymous object type.
  if (Array.isArray(decl.children)) {
    return {
      type: 'reflection',
      declaration: {
        name: '__type',
        variant: 'declaration',
        kind: ReflectionKind.TypeLiteral,
        children: structuredClone(decl.children),
      },
    };
  }
  return undefined;
}

/**
 * After substitution, any remaining `{type:"reference", name: T}` nodes for
 * tagged `T` are places we couldn't substitute (e.g. unusual positions).
 * Rewrite them as `{type:"intrinsic"}` so the renderer prints the name as
 * plain text instead of producing an auto-link to a non-existent
 * `#typename` anchor.
 *
 * @internal Exported for testing.
 */
export function suppressLeftoverReferences(jsonRoot: unknown, taggedTypes: Set<string>): void {
  if (taggedTypes.size === 0) return;
  walk(jsonRoot, (node) => {
    if (!isObject(node)) return;
    if (node.type !== 'reference' || typeof node.name !== 'string' || !taggedTypes.has(node.name)) {
      return;
    }
    const name = node.name;
    for (const k of Object.keys(node)) delete node[k];
    node.type = 'intrinsic';
    node.name = name;
  });
}

/**
 * Drops any tagged type that the entry-point file re-exported (via
 * `export *`). Tagged types are for substitution only — they shouldn't render
 * as their own section.
 *
 * @internal Exported for testing.
 */
export function removeTaggedFromTopLevel(jsonRoot: unknown, taggedTypes: Set<string>): void {
  if (!isObject(jsonRoot) || !Array.isArray(jsonRoot.children)) return;
  jsonRoot.children = (jsonRoot.children as any[]).filter(
    (entry: any) => !taggedTypes.has(entry?.name)
  );
}

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

type ObjectNode = Record<string, any>;

function isObject(value: unknown): value is ObjectNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Visits every node in the tree, descending into arrays and objects. */
function walk(node: unknown, visit: (node: unknown) => void): void {
  visit(node);
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
  } else if (isObject(node)) {
    for (const key of Object.keys(node)) walk(node[key], visit);
  }
}
