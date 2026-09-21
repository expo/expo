import { diffArrays } from 'diff';
import fs from 'fs-extra';
import path from 'path';

import { getExpoRepositoryRootDir, getPrecompileDir } from '../../Directories';
import { findSwiftInterfaces } from '../SwiftInterfaceChecks';
import { readExportedSymbols, type SymbolReader, type SymbolSet } from './SymbolTable';

export type DifferenceKind = 'structure' | 'symbols' | 'interface';

export interface EquivalenceDifference {
  /** Slice directory name, or `null` for a difference at the xcframework level. */
  slice: string | null;
  /** Architecture within the slice, for differences found inside a binary. */
  architecture?: string;
  kind: DifferenceKind;
  /** Names the differing item. Never merely "differs". */
  summary: string;
  onlyInA: string[];
  onlyInB: string[];
  /** What the difference implies, and what to do about it. */
  detail?: string;
}

export interface EquivalenceReport {
  equivalent: boolean;
  pathA: string;
  pathB: string;
  labelA: string;
  labelB: string;
  differences: EquivalenceDifference[];
}

export interface CompareOptions {
  labelA?: string;
  labelB?: string;
  readSymbols?: SymbolReader;
  /**
   * Absolute directories whose paths collapse to `<PATH>`. Defaults to the repo root and the
   * prebuild cache, the two trees whose layout differs between build modes by design.
   */
  pathRoots?: string[];
}

interface CompareContext {
  labelA: string;
  labelB: string;
  readSymbols: SymbolReader;
  pathRoots: string[];
}

interface TreeEntry {
  path: string;
  isDirectory: boolean;
}

/** Excluded from the comparison entirely: both differ between any two builds of one source. */
const IGNORED_ENTRY = /^dSYMs(\/|$)|(^|\/)_CodeSignature(\/|$)/;

/**
 * Compared by content, not only by name. Headers carry the whole public API of a pure-ObjC
 * package, which emits no `.swiftinterface` and whose method signatures export no symbols.
 */
const TEXT_ENTRY = /(^|\/)Headers\/|\.modulemap$|\.xcprivacy$|\.swiftinterface$/;

const MODULE_FLAGS = /^\/\/ swift-module-flags(?:-ignorable)?:/;

/**
 * Compared only when both sides have one.
 *
 * A `.package.swiftinterface` declares `package`-level API: reachable from the rest of the same
 * Swift package, never from a consumer of the built framework. Its absence on one side therefore
 * does not change the API these artifacts expose to consumers. When both sides carry one, its
 * contents are still compared.
 */
const PACKAGE_INTERFACE_SUFFIX = '.package.swiftinterface';

const MAX_PRINTED_ITEMS = 20;

/**
 * Compares two built `.xcframework`s on exported symbols, public interface and structure.
 *
 * Bytes, `Info.plist` contents, dSYMs and signatures are deliberately not compared: they differ
 * between any two builds of the same source, so a byte gate reports a difference every time.
 */
export function compareXCFrameworks(
  pathA: string,
  pathB: string,
  opts: CompareOptions = {}
): EquivalenceReport {
  const ctx: CompareContext = {
    labelA: opts.labelA ?? 'A',
    labelB: opts.labelB ?? 'B',
    readSymbols: opts.readSymbols ?? readExportedSymbols,
    pathRoots: opts.pathRoots ?? defaultPathRoots(),
  };

  const slicesA = readSlices(pathA, ctx.labelA);
  const slicesB = readSlices(pathB, ctx.labelB);
  const differences: EquivalenceDifference[] = [];

  for (const slice of sortedUnion(slicesA, slicesB)) {
    if (!slicesA.has(slice) || !slicesB.has(slice)) {
      const presentIn = slicesA.has(slice) ? ctx.labelA : ctx.labelB;
      const missingFrom = slicesA.has(slice) ? ctx.labelB : ctx.labelA;
      differences.push({
        slice,
        kind: 'structure',
        summary: `Slice ${slice} is present in ${presentIn} and missing from ${missingFrom}`,
        onlyInA: slicesA.has(slice) ? [slice] : [],
        onlyInB: slicesB.has(slice) ? [slice] : [],
        detail:
          `${missingFrom} did not produce this architecture or platform, so apps built for it ` +
          `would fail to link. Check that the build for ${slice} ran and succeeded, and that ` +
          `both sides were built for the same platforms.`,
      });
      continue;
    }
    differences.push(...compareSlice(slice, path.join(pathA, slice), path.join(pathB, slice), ctx));
  }

  return {
    equivalent: differences.length === 0,
    pathA,
    pathB,
    labelA: ctx.labelA,
    labelB: ctx.labelB,
    differences,
  };
}

/**
 * Collapses the parts of a build artifact's text that legitimately differ between two builds:
 * filesystem paths rooted at one of `pathRoots`, trailing whitespace and line endings.
 *
 * Path collapsing is anchored and skips string literals on purpose. An unanchored rule erases real
 * changes — a public default of `"https://api.example.com/v1"` and a `-DFACTOR=8/2/1` macro both
 * look like paths to a `/a/b`-shaped pattern, and both are public API.
 */
export function normalizeArtifactText(text: string, pathRoots: string[]): string {
  const collapse = pathCollapser(pathRoots);
  const lines = text.split(/\r?\n/).map((line) => collapse(line).replace(/[ \t]+$/, ''));
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.join('\n');
}

export function formatEquivalenceReport(report: EquivalenceReport): string {
  const { labelA, labelB, pathA, pathB, differences } = report;
  const verdict = report.equivalent
    ? 'Equivalent — same exported symbols, same public interface, same structure.'
    : `Not equivalent — ${differences.length} ${plural(differences.length, 'difference')}.`;
  const lines = [verdict, `  ${labelA}: ${pathA}`, `  ${labelB}: ${pathB}`];

  for (const [slice, group] of groupBySlice(differences)) {
    lines.push('', `  ${slice ?? '(xcframework)'}`);
    for (const difference of group) {
      const label = difference.architecture
        ? `${difference.kind} ${difference.architecture}`
        : difference.kind;
      lines.push(`    [${label}] ${difference.summary}`);
      lines.push(...printItems(`only in ${labelA}`, difference.onlyInA));
      lines.push(...printItems(`only in ${labelB}`, difference.onlyInB));
      if (difference.detail) {
        lines.push(`      ${difference.detail}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

function defaultPathRoots(): string[] {
  return [getExpoRepositoryRootDir(), getPrecompileDir()];
}

function compareSlice(
  slice: string,
  dirA: string,
  dirB: string,
  ctx: CompareContext
): EquivalenceDifference[] {
  const differences = compareSliceTree(slice, dirA, dirB, ctx);

  const frameworksA = new Set(listFrameworks(dirA));
  for (const name of listFrameworks(dirB)
    .filter((n) => frameworksA.has(n))
    .sort()) {
    const frameworkA = path.join(dirA, name);
    const frameworkB = path.join(dirB, name);
    const product = path.basename(name, '.framework');
    const inA = fs.existsSync(path.join(frameworkA, product));
    const inB = fs.existsSync(path.join(frameworkB, product));
    if (inA && inB) {
      differences.push(...compareSymbols(slice, frameworkA, frameworkB, product, ctx));
    } else if (!inA && !inB) {
      // A binary missing from one side is already a tree difference. Missing from both is the
      // "two empty things are equal" case `readSlices` rejects, one level further down.
      differences.push({
        slice,
        kind: 'structure',
        summary: `${name} carries no ${product} binary in ${ctx.labelA} or ${ctx.labelB}, so no symbols were compared`,
        onlyInA: [],
        onlyInB: [],
        detail:
          `The binary is what an app links, and two frameworks without one compare as equal ` +
          `because there is nothing to compare. Check that the build produced ${product} for ` +
          `this slice, and that nothing stripped it out of the artifact afterwards.`,
      });
    }
    differences.push(...compareInterfaces(slice, frameworkA, frameworkB, ctx));
  }

  return differences;
}

/**
 * Compares everything the slice contains, not only the `*.framework`. Real slices carry resource
 * bundles beside the framework and inside it, each holding a `PrivacyInfo.xcprivacy`, and this
 * project has already shipped a build that lost them.
 */
function compareSliceTree(
  slice: string,
  dirA: string,
  dirB: string,
  ctx: CompareContext
): EquivalenceDifference[] {
  const treeA = readTree(dirA);
  const treeB = readTree(dirB);
  const kindA = new Map(treeA.map((entry) => [entry.path, entry.isDirectory]));
  const kindB = new Map(treeB.map((entry) => [entry.path, entry.isDirectory]));
  const differences: EquivalenceDifference[] = [];

  const onlyInA = collapseToRoots(treeA.filter((entry) => !kindB.has(entry.path)));
  const onlyInB = collapseToRoots(treeB.filter((entry) => !kindA.has(entry.path)));
  if (onlyInA.length > 0 || onlyInB.length > 0) {
    differences.push({
      slice,
      kind: 'structure',
      summary: `Slice contents differ: ${describe(onlyInA, ctx.labelA, onlyInB, ctx.labelB)}`,
      onlyInA,
      onlyInB,
      detail:
        `An app embeds the whole slice, so anything present on one side only — a framework, a ` +
        `public header, a resource bundle, a PrivacyInfo.xcprivacy — ships to users in one build ` +
        `and not the other. Check the target's resources and public header list.`,
    });
  }

  const differingKinds = treeA
    .filter((entry) => kindB.has(entry.path) && kindB.get(entry.path) !== entry.isDirectory)
    .map((entry) => entry.path)
    .sort();
  if (differingKinds.length > 0) {
    const describeKind = (kinds: Map<string, boolean>) =>
      differingKinds.map((item) => `${item} (${kinds.get(item) ? 'directory' : 'file'})`);
    differences.push({
      slice,
      kind: 'structure',
      summary: `Entries share a name but not a kind: ${list(differingKinds)}`,
      onlyInA: describeKind(kindA),
      onlyInB: describeKind(kindB),
      detail:
        `A directory in one build and a file in the other are not the same thing under the same ` +
        `name, and every comparison that matches on the name alone — including the rest of this ` +
        `report — reads them as a match. Check what writes this path in each build.`,
    });
  }

  for (const entry of treeA) {
    if (entry.isDirectory || !TEXT_ENTRY.test(entry.path) || kindB.get(entry.path) !== false) {
      continue;
    }
    const delta = textDelta(
      path.join(dirA, entry.path),
      path.join(dirB, entry.path),
      ctx.pathRoots
    );
    if (delta) {
      differences.push({
        slice,
        kind: 'structure',
        summary: `${entry.path}: ${describeTextDelta(delta, ctx)}`,
        onlyInA: delta.onlyInA,
        onlyInB: delta.onlyInB,
        detail:
          `This file is part of what consumers compile against: a module map declares the module, ` +
          `a header declares the ObjC API, a .swiftinterface declares the Swift API, a ` +
          `PrivacyInfo.xcprivacy declares what the app reports to the App Store. Check whether ` +
          `the source behind the changed line is in both builds.`,
      });
    }
  }

  return differences;
}

function compareSymbols(
  slice: string,
  frameworkA: string,
  frameworkB: string,
  product: string,
  ctx: CompareContext
): EquivalenceDifference[] {
  const archesA = ctx.readSymbols(path.join(frameworkA, product));
  const archesB = ctx.readSymbols(path.join(frameworkB, product));
  const differences: EquivalenceDifference[] = [];

  const architecturesOnlyInA = [...archesA.keys()].filter((arch) => !archesB.has(arch)).sort();
  const architecturesOnlyInB = [...archesB.keys()].filter((arch) => !archesA.has(arch)).sort();
  if (architecturesOnlyInA.length > 0 || architecturesOnlyInB.length > 0) {
    differences.push({
      slice,
      kind: 'structure',
      summary: `Architectures in the ${product} binary differ: ${describe(
        architecturesOnlyInA,
        ctx.labelA,
        architecturesOnlyInB,
        ctx.labelB
      )}`,
      onlyInA: architecturesOnlyInA,
      onlyInB: architecturesOnlyInB,
      detail:
        `A binary that lost an architecture still links for the ones it kept, so the build stays ` +
        `green and only the device or simulator needing the missing one fails. Compare the ARCHS ` +
        `and destinations of the two builds.`,
    });
  }

  for (const architecture of [...archesA.keys()].filter((arch) => archesB.has(arch)).sort()) {
    const onlyInA = difference(archesA.get(architecture)!, archesB.get(architecture)!);
    const onlyInB = difference(archesB.get(architecture)!, archesA.get(architecture)!);
    if (onlyInA.length === 0 && onlyInB.length === 0) {
      continue;
    }
    differences.push({
      slice,
      architecture,
      kind: 'symbols',
      summary: `Exported symbols differ in ${product} (${architecture}): ${describe(onlyInA, ctx.labelA, onlyInB, ctx.labelB)}`,
      onlyInA,
      onlyInB,
      detail:
        `Exported symbols are the framework's ABI: a symbol only ${ctx.labelA} has is one apps ` +
        `linking ${ctx.labelB} cannot resolve. Names are mangled — run \`xcrun swift-demangle\` ` +
        `on one to see the declaration it belongs to, then check whether that source file is in ` +
        `both builds' target.`,
    });
  }

  return differences;
}

function compareInterfaces(
  slice: string,
  frameworkA: string,
  frameworkB: string,
  ctx: CompareContext
): EquivalenceDifference[] {
  const interfacesA = indexSwiftInterfaces(frameworkA);
  const interfacesB = indexSwiftInterfaces(frameworkB);
  const differences: EquivalenceDifference[] = [];

  for (const key of sortedUnion(new Set(interfacesA.keys()), new Set(interfacesB.keys()))) {
    const fileA = interfacesA.get(key);
    const fileB = interfacesB.get(key);

    if (!fileA || !fileB) {
      if (key.endsWith(PACKAGE_INTERFACE_SUFFIX)) {
        continue;
      }
      differences.push({
        slice,
        kind: 'interface',
        summary: `${key} is present in ${fileA ? ctx.labelA : ctx.labelB} and missing from ${
          fileA ? ctx.labelB : ctx.labelA
        }`,
        onlyInA: fileA ? [key] : [],
        onlyInB: fileB ? [key] : [],
        detail:
          `Swift consumers read the interface to resolve the module, so a missing one makes the ` +
          `framework unimportable from Swift. Check that library evolution is enabled for that ` +
          `build.`,
      });
      continue;
    }

    const delta = textDelta(fileA, fileB, ctx.pathRoots);
    if (!delta) {
      continue;
    }

    const flags = describeFlagDelta(delta.onlyInA, delta.onlyInB, ctx);
    differences.push({
      slice,
      kind: 'interface',
      summary: `${key}: ${flags ?? describeTextDelta(delta, ctx)}`,
      onlyInA: delta.onlyInA,
      onlyInB: delta.onlyInB,
      detail: interfaceDetail(delta, flags !== null),
    });
  }

  return differences;
}

interface TextDelta {
  onlyInA: string[];
  onlyInB: string[];
  /** The two sides hold the same lines in a different order. */
  reordered: boolean;
}

function textDelta(fileA: string, fileB: string, pathRoots: string[]): TextDelta | null {
  const linesA = meaningfulLines(fs.readFileSync(fileA, 'utf8'), pathRoots);
  const linesB = meaningfulLines(fs.readFileSync(fileB, 'utf8'), pathRoots);
  const { onlyInA, onlyInB } = lineDelta(linesA, linesB);
  if (onlyInA.length === 0 && onlyInB.length === 0) {
    return null;
  }
  return { onlyInA, onlyInB, reordered: sameMultiset(onlyInA, onlyInB) };
}

function meaningfulLines(text: string, pathRoots: string[]): string[] {
  return normalizeArtifactText(text, pathRoots)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function describeTextDelta(delta: TextDelta, ctx: CompareContext): string {
  if (delta.reordered) {
    return `lines are reordered — ${list(delta.onlyInA)} moved`;
  }
  return describe(delta.onlyInA, ctx.labelA, delta.onlyInB, ctx.labelB);
}

function interfaceDetail(delta: TextDelta, isFlagChange: boolean): string {
  if (looksLikeDoubleColonRewrite(delta.onlyInA, delta.onlyInB)) {
    return (
      `Every differing line matches once \`Target::Type\` is read as \`Target.Type\`. That is the ` +
      `known Xcode-27 interface rewrite in Frameworks.ts, not a build difference — fix the ` +
      `rewrite rather than the package.`
    );
  }
  if (delta.reordered) {
    return (
      `The same lines appear in a different order. Order is public API in an interface: an ` +
      `attribute such as \`@available\` binds to the declaration that follows it, so moving one ` +
      `changes what consumers may call.`
    );
  }
  if (isFlagChange) {
    return (
      `The compiler flags baked into the interface changed, so the two frameworks were not built ` +
      `the same way even where their symbols agree. Compare the two builds' settings before ` +
      `trusting the rest of this report.`
    );
  }
  return (
    `The public Swift interface is what consumers compile against, so a changed declaration is a ` +
    `source-breaking change even when the symbol survives. Check whether the source file behind ` +
    `the line is in both builds' target.`
  );
}

function describeFlagDelta(
  onlyInA: string[],
  onlyInB: string[],
  ctx: CompareContext
): string | null {
  if (onlyInA.length === 0 || onlyInA.length !== onlyInB.length) {
    return null;
  }
  if (![...onlyInA, ...onlyInB].every((line) => MODULE_FLAGS.test(line))) {
    return null;
  }

  const parts: string[] = [];
  for (const lineA of onlyInA) {
    const prefix = lineA.match(MODULE_FLAGS)![0];
    const lineB = onlyInB.find((line) => line.startsWith(prefix));
    if (!lineB) {
      return null;
    }
    const delta = lineDelta(lineA.split(/\s+/), lineB.split(/\s+/));
    const name = prefix.replace('// ', '').replace(':', '');
    parts.push(
      `${name} changed — ${describe(delta.onlyInA, ctx.labelA, delta.onlyInB, ctx.labelB)}`
    );
  }
  return parts.join('; ');
}

function looksLikeDoubleColonRewrite(onlyInA: string[], onlyInB: string[]): boolean {
  if (onlyInA.length === 0 || onlyInA.length !== onlyInB.length) {
    return false;
  }
  if (![...onlyInA, ...onlyInB].some((line) => line.includes('::'))) {
    return false;
  }
  const collapse = (lines: string[]) =>
    lines
      .map((line) => line.replace(/::/g, '.'))
      .sort()
      .join('\n');
  return collapse(onlyInA) === collapse(onlyInB);
}

function readSlices(xcframeworkPath: string, label: string): Set<string> {
  if (!fs.existsSync(xcframeworkPath)) {
    throw new Error(
      `There is no xcframework at ${xcframeworkPath} (side ${label}). The equivalence check ` +
        `compares two built artifacts, so it cannot start without both. Build the package first ` +
        `(\`et prebuild <package> -f <flavor>\`) or point at an existing ` +
        `\`packages/precompile/.build/<package>/output/<flavor>/xcframeworks/<Product>.xcframework\`.`
    );
  }

  // Every directory is a slice, including one holding no `.framework`: a slice can carry a
  // resource bundle and nothing else, and dropping it here would compare its contents against
  // nothing on either side.
  const slices = new Set(
    fs
      .readdirSync(xcframeworkPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  );

  const carriesFramework = [...slices].some(
    (slice) => listFrameworks(path.join(xcframeworkPath, slice)).length > 0
  );

  if (!carriesFramework) {
    throw new Error(
      `${xcframeworkPath} (side ${label}) contains no platform slice with a \`.framework\` in it. ` +
        `An empty artifact would compare as equivalent to any other empty artifact, so the check ` +
        `refuses to run on one. Check that the build finished and that the path points at the ` +
        `\`.xcframework\` directory itself.`
    );
  }

  return slices;
}

function listFrameworks(sliceDir: string): string[] {
  if (!fs.existsSync(sliceDir)) {
    return [];
  }
  return fs
    .readdirSync(sliceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('.framework'))
    .map((entry) => entry.name);
}

function readTree(dir: string, prefix = '', comparedInterfaces?: Set<string>): TreeEntry[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  if (!comparedInterfaces) {
    dir = fs.realpathSync(dir);
  }
  // Exclude the exact files the interface comparison reads. Canonical paths also cover a
  // versioned macOS framework whose Modules entry is a symlink into Versions/A.
  const interfaces =
    comparedInterfaces ??
    new Set(
      listFrameworks(dir).flatMap((framework) =>
        findSwiftInterfaces(path.join(dir, framework)).flatMap((file) => [
          path.resolve(file),
          fs.realpathSync(file),
        ])
      )
    );
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (
      IGNORED_ENTRY.test(relativePath) ||
      (entry.name.endsWith('.swiftinterface') && interfaces.has(path.resolve(dir, entry.name)))
    ) {
      return [];
    }
    return entry.isDirectory()
      ? [
          { path: relativePath, isDirectory: true },
          ...readTree(path.join(dir, entry.name), relativePath, interfaces),
        ]
      : [{ path: relativePath, isDirectory: false }];
  });
}

/** Reports a missing subtree as its root rather than as every file underneath it. */
function collapseToRoots(entries: TreeEntry[]): string[] {
  const missing = new Set(entries.map((entry) => entry.path));
  return entries
    .filter((entry) => !ancestorsOf(entry.path).some((ancestor) => missing.has(ancestor)))
    .map((entry) => entry.path)
    .sort();
}

function ancestorsOf(relativePath: string): string[] {
  const segments = relativePath.split('/');
  return segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('/'));
}

function indexSwiftInterfaces(frameworkPath: string): Map<string, string> {
  const modules = path.join(frameworkPath, 'Modules');
  return new Map(
    findSwiftInterfaces(frameworkPath).map((file) => [path.relative(modules, file), file])
  );
}

function pathCollapser(roots: string[]): (line: string) => string {
  if (roots.length === 0) {
    return (line) => line;
  }
  const rooted = new RegExp(
    `(?:${roots.map(escapeRegExp).join('|')})(?![\\w.-])(?:/[^\\s"'<>,;)]*)?`,
    'g'
  );
  return (line) =>
    line
      .split(/("(?:[^"\\]|\\.)*")/)
      .map((part, index) => (index % 2 === 1 ? part : part.replace(rooted, '<PATH>')))
      .join('');
}

function lineDelta(a: string[], b: string[]): { onlyInA: string[]; onlyInB: string[] } {
  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  for (const part of diffArrays(a, b)) {
    if (part.removed) {
      onlyInA.push(...part.value);
    } else if (part.added) {
      onlyInB.push(...part.value);
    }
  }
  return { onlyInA, onlyInB };
}

function sameMultiset(a: string[], b: string[]): boolean {
  return a.length > 0 && [...a].sort().join('\n') === [...b].sort().join('\n');
}

function difference(a: SymbolSet, b: SymbolSet): string[] {
  return [...a].filter((symbol) => !b.has(symbol)).sort();
}

function sortedUnion(a: Set<string>, b: Set<string>): string[] {
  return [...new Set([...a, ...b])].sort();
}

function describe(onlyInA: string[], labelA: string, onlyInB: string[], labelB: string): string {
  const side = (items: string[], label: string) =>
    items.length === 0 ? `none only in ${label}` : `only in ${label}: ${list(items)}`;
  return `${side(onlyInA, labelA)}; ${side(onlyInB, labelB)}`;
}

function list(items: string[], limit = 3): string {
  const shown = items.slice(0, limit).join(', ');
  return items.length > limit ? `${shown} and ${items.length - limit} more` : shown;
}

function printItems(label: string, items: string[]): string[] {
  return items
    .slice(0, MAX_PRINTED_ITEMS)
    .map((item) => `      ${label}: ${item}`)
    .concat(
      items.length > MAX_PRINTED_ITEMS
        ? [`      ${label}: … and ${items.length - MAX_PRINTED_ITEMS} more`]
        : []
    );
}

function groupBySlice(
  differences: EquivalenceDifference[]
): Map<string | null, EquivalenceDifference[]> {
  const groups = new Map<string | null, EquivalenceDifference[]>();
  for (const difference of differences) {
    const group = groups.get(difference.slice);
    if (group) {
      group.push(difference);
    } else {
      groups.set(difference.slice, [difference]);
    }
  }
  return groups;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}
