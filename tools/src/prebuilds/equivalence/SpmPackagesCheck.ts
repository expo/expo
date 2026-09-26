import fs from 'fs-extra';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'path';
import stripAnsi from 'strip-ansi';

import type { BuildFlavor } from '../Prebuilder.types';
import { readArchitectures } from './SymbolTable';

export type SpmPackagesCheckName =
  | 'manifest-declaration'
  | 'prepared-xcframework'
  | 'build-log-warning'
  | 'runtime-link';

export interface SpmDependencyRef {
  /** The SPM product the Expo product links, e.g. `SDWebImage`. */
  productName: string;
  url?: string;
  packageName?: string;
}

/** One built `.xcframework` and the product slice binaries found inside it. */
export interface InspectedArtifact {
  /** Resolved path of the `.xcframework`, reported as-is so no label can misdescribe it. */
  path: string;
  binaries: string[];
}

/** One `.binaryTarget` of a manifest. */
export interface SwiftBinaryTarget {
  name: string;
  /** Where its artifact comes from: the declared `path:`, or the `url:` of a remote target. */
  location: string;
  /**
   * The declared path against the manifest's own directory, normalized, so that a `..` cannot undo
   * the flavor directory it names. `null` for a remote binary target, which names no path.
   */
  relativePath: string | null;
}

/**
 * A `Package.swift`, read with `swift package dump-package`.
 *
 * Reading it structurally rather than scanning its text is the point: a declaration quoted in a
 * comment, in a nested comment or in a string literal is not a declaration, and nothing short of
 * SwiftPM tells those apart.
 */
export type SwiftManifest =
  | { path: string; found: false }
  | {
      path: string;
      found: true;
      /** The URLs of its `.package(url:)` declarations. */
      packageUrls: string[];
      binaryTargets: SwiftBinaryTarget[];
    };

export interface SpmPackagesCheckInput {
  /** The Expo product that declares the dependencies, e.g. `ExpoImage`. */
  product: string;
  flavor: BuildFlavor;
  spmPackages: SpmDependencyRef[];
  /**
   * The `Package.swift` the pipeline generated for this product and flavor, read once so that
   * every check reports on the same manifest even if the generator rewrites the file meanwhile.
   */
  manifest: SwiftManifest;
  /** `packages/precompile/.build/.spm-deps`, where shared dependencies are prepared. */
  sharedSpmDepsRoot: string;
  /** Captured build output. Empty when none was supplied; the log check is then skipped. */
  buildLog: string;
  /** Every artifact to read linkage out of. Both sides, so neither can be the unchecked one. */
  artifacts: InspectedArtifact[];
}

export interface SpmPackageDiagnostic {
  check: SpmPackagesCheckName;
  dependency: string;
  status: 'pass' | 'fail' | 'skipped';
  message: string;
}

export interface SpmPackagesCheckOptions {
  /**
   * Reads the install names a binary links against, per architecture. Injectable so tests never
   * shell out.
   */
  readLinkedLibraries?: (binaryPath: string) => Map<string, string[]>;
}

/** One `(binary, architecture)` pair and what it links. */
interface LinkedImage {
  label: string;
  installNames: Set<string>;
}

/** An artifact and every `(binary, architecture)` pair read out of it. */
interface InspectedSide {
  artifact: InspectedArtifact;
  images: LinkedImage[];
}

/**
 * Asserts that a product's `spmPackages` dependencies really reached the build output.
 *
 * A symbol comparison cannot catch a dropped SPM dependency: `Frameworks.ts` logs
 * `⚠️  SPM dependency <name> not found in Build/Products/` and carries on, so the build goes green
 * with the dependency simply absent. These four checks are what distinguishes that from a correct
 * build, in which a *shared* dependency legitimately sits in `.build/.spm-deps/` rather than beside
 * the product xcframework.
 */
export function assertSpmPackagesResolved(
  input: SpmPackagesCheckInput,
  opts: SpmPackagesCheckOptions = {}
): SpmPackageDiagnostic[] {
  if (input.spmPackages.length === 0) {
    return [];
  }

  if (input.artifacts.length === 0) {
    throw new Error(
      `No artifact to read the linkage of ${input.product} out of. The runtime-link check is the ` +
        `one that reads the built binaries, and with nothing to read it would report every ` +
        `dependency as linked — a silent pass on a build nobody looked at. Pass every ` +
        `\`.xcframework\` under test in \`artifacts\`.`
    );
  }

  const readLinkedLibraries = opts.readLinkedLibraries ?? readLinkedLibrariesWithOtool;
  const buildLog = stripAnsi(input.buildLog);
  const sides: InspectedSide[] = input.artifacts.map((artifact) => ({
    artifact,
    images: artifact.binaries.flatMap((binaryPath) =>
      [...readLinkedLibraries(binaryPath)].map(([architecture, installNames]) => ({
        label: `${describeBinary(binaryPath)}/${architecture}`,
        installNames: new Set(installNames),
      }))
    ),
  }));

  return input.spmPackages.flatMap((dependency) => [
    checkManifestDeclaration(dependency, input.manifest),
    checkPreparedXCFramework(dependency, input),
    checkBuildLog(dependency, input, buildLog),
    ...sides.map((side) => checkRuntimeLink(dependency, input, side)),
  ]);
}

/**
 * Reads a `Package.swift` through SwiftPM, or reports that there is none to read.
 *
 * A missing manifest is not an error here: the `manifest-declaration` check reports it against the
 * dependency it could not confirm, which says more than a bare "file not found".
 */
export function readSwiftManifest(manifestPath: string): SwiftManifest {
  if (!fs.existsSync(manifestPath)) {
    return { path: manifestPath, found: false };
  }

  const dumped = dumpPackage(manifestPath);
  const directory = path.dirname(path.resolve(manifestPath));

  return {
    path: manifestPath,
    found: true,
    packageUrls: (dumped.dependencies ?? []).flatMap((dependency) =>
      (dependency.sourceControl ?? []).flatMap((source) =>
        (source.location?.remote ?? []).map((remote) => remote.urlString)
      )
    ),
    binaryTargets: (dumped.targets ?? [])
      .filter((target) => target.type === 'binary')
      .map((target) => ({
        name: target.name,
        location: target.path ?? target.url ?? '',
        relativePath:
          target.path == null
            ? null
            : path.relative(directory, path.resolve(directory, target.path)),
      })),
  };
}

/**
 * Asserts that a generated `Package.swift` describes a build of `flavor`.
 *
 * The generator writes one manifest per product and every flavor and build mode overwrites it, so
 * the manifest on disk can describe a different build entirely. Its `.binaryTarget` paths point at
 * the flavor the build used, which is the one piece of evidence tying a manifest to an artifact —
 * so a manifest that carries none of that evidence is refused rather than passed.
 *
 * A manifest that does not exist is left to the `manifest-declaration` check to report.
 */
export function assertManifestMatchesFlavor(manifest: SwiftManifest, flavor: BuildFlavor): void {
  if (!manifest.found) {
    return;
  }

  const expected = flavor.toLowerCase();
  const evidence = manifest.binaryTargets
    .map((target) => ({ target, directory: flavorDirectoryOf(target, manifest.path) }))
    .filter(
      (reading): reading is { target: SwiftBinaryTarget; directory: string } => !!reading.directory
    );

  const contradiction = evidence.find((reading) => reading.directory !== expected);
  if (contradiction) {
    throw new Error(
      `${manifest.path} is a ${contradiction.directory} manifest, and the artifacts under test are ` +
        `${flavor}: it declares \`.binaryTarget(name: "${contradiction.target.name}", ` +
        `path: "${contradiction.target.location}")\`, which resolves to ` +
        `${contradiction.target.relativePath}. Every flavor and build mode overwrites a product's ` +
        `generated manifest, so this one describes another build and its dependency declarations ` +
        `say nothing about these artifacts. Pass --manifest with the Package.swift that produced ` +
        `this ${flavor} build.`
    );
  }

  if (evidence.length === 0) {
    throw new Error(
      `The flavor check cannot tell whether ${manifest.path} describes this ${flavor} build: ` +
        (manifest.binaryTargets.length === 0
          ? `it declares no binary target.`
          : `none of its ${manifest.binaryTargets.length} binary target paths names a debug or ` +
            `release directory.`) +
        ` A generated manifest is tied to a build only by those paths, and every flavor and build ` +
        `mode overwrites a product's manifest, so accepting one that names no flavor would let ` +
        `another build's dependency declarations vouch for these artifacts. Pass --manifest with ` +
        `the Package.swift that produced this ${flavor} build, or --skip-spm-packages-check to ` +
        `compare the artifacts only.`
    );
  }
}

export function formatSpmPackageDiagnostics(diagnostics: SpmPackageDiagnostic[]): string {
  const rank = { fail: 0, skipped: 1, pass: 2 };
  const marker = { fail: '✗', skipped: '–', pass: '✓' };
  return [...diagnostics]
    .sort((a, b) => rank[a.status] - rank[b.status])
    .map((d) => `  ${marker[d.status]} ${d.dependency} ${d.check}: ${d.message}`)
    .join('\n');
}

/** Reads the install names out of `otool -L` output. */
export function parseOtoolLibraries(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim().match(/^(\S+) \(compatibility version /)?.[1])
    .filter((name): name is string => name !== undefined);
}

function checkManifestDeclaration(
  dependency: SpmDependencyRef,
  manifest: SwiftManifest
): SpmPackageDiagnostic {
  if (!manifest.found) {
    return fail(
      'manifest-declaration',
      dependency,
      `No generated manifest at ${manifest.path}. Without it there is no way to tell whether ` +
        `SwiftPM was ever asked for ${dependency.productName}. Build the product, or pass ` +
        `--manifest with the Package.swift the build used.`
    );
  }

  if (dependency.url !== undefined && manifest.packageUrls.includes(dependency.url)) {
    return pass('manifest-declaration', dependency, `declared as .package(url:)`);
  }

  const binaryTarget = manifest.binaryTargets.find(
    (target) => target.name === dependency.productName
  );
  if (binaryTarget && artifactName(binaryTarget) === `${dependency.productName}.xcframework`) {
    return pass('manifest-declaration', dependency, `declared as .binaryTarget(path: …)`);
  }
  if (binaryTarget) {
    return fail(
      'manifest-declaration',
      dependency,
      `${manifest.path} declares \`.binaryTarget(name: "${dependency.productName}")\` but its ` +
        `path points at "${binaryTarget.location}", not at ${dependency.productName}.xcframework. ` +
        `The product would link whatever that other artifact exports. Check the SPM dependency ` +
        `resolution that wrote this manifest.`
    );
  }

  return fail(
    'manifest-declaration',
    dependency,
    `${manifest.path} declares neither \`.package(url:)\` nor \`.binaryTarget(\` for ` +
      `${dependency.productName}, so SwiftPM never saw the dependency and the product was built ` +
      `without it. Check that \`spmPackages\` still lists ${dependency.productName} in the ` +
      `product's spm.config.json, and that the manifest generator emitted it.`
  );
}

function checkPreparedXCFramework(
  dependency: SpmDependencyRef,
  input: SpmPackagesCheckInput
): SpmPackageDiagnostic {
  const preparedPath = sharedSpmDepFrameworkPath(input, dependency.productName);
  if (fs.existsSync(preparedPath)) {
    return pass('prepared-xcframework', dependency, `prepared at ${preparedPath}`);
  }
  return fail(
    'prepared-xcframework',
    dependency,
    `No prepared xcframework at ${preparedPath}. The shared dependency is vendored from that ` +
      `location at pod install time, so an app would link ${input.product} against a framework ` +
      `that is nowhere on disk. Rebuild the dependency, or check that the ${input.flavor} flavor ` +
      `of ${dependency.productName}.xcframework was produced.`
  );
}

function checkBuildLog(
  dependency: SpmDependencyRef,
  input: SpmPackagesCheckInput,
  buildLog: string
): SpmPackageDiagnostic {
  if (buildLog.trim() === '') {
    return {
      check: 'build-log-warning',
      dependency: dependency.productName,
      status: 'skipped',
      message:
        `No build log supplied, so the silent "not found in Build/Products/" warning could not ` +
        `be ruled out. Capture the build (\`et prebuild … 2>&1 | tee build.log\`) and pass it ` +
        `with --build-log, or accept the gap with --allow-missing-build-log.`,
    };
  }

  // Anchored on the exact wording so a warning about SDWebImageAVIFCoder is not read as one
  // about SDWebImage — expo-image ships both.
  const warning = new RegExp(
    `SPM dependency ${escapeRegExp(dependency.productName)} not found in Build/Products/.*`
  ).exec(buildLog);

  if (!warning) {
    return pass('build-log-warning', dependency, 'no "not found in Build/Products/" warning');
  }

  return fail(
    'build-log-warning',
    dependency,
    `The build logged "${warning[0].trim()}". That warning is not fatal: the build completes and ` +
      `the dependency is silently missing from the output and the tarball. Check how ` +
      `${dependency.productName} is declared for this product, then rebuild and confirm the ` +
      `warning is gone.`
  );
}

/** Verdicts name the artifact they read, so no mix-up of the two sides can read as reassurance. */
function checkRuntimeLink(
  dependency: SpmDependencyRef,
  input: SpmPackagesCheckInput,
  { artifact, images }: InspectedSide
): SpmPackageDiagnostic {
  const installName = `@rpath/${dependency.productName}.framework/${dependency.productName}`;
  const missing = images.filter((image) => !image.installNames.has(installName));

  if (images.length === 0) {
    return fail(
      'runtime-link',
      dependency,
      `No ${input.product} binary to inspect in ${artifact.path}. Linkage is read out of the ` +
        `built binaries, so the check cannot run without them, and an artifact it cannot read is ` +
        `not a passing one. Check that the xcframework holds a \`.framework\` with a binary in at ` +
        `least one slice.`
    );
  }
  if (missing.length === 0) {
    return pass(
      'runtime-link',
      dependency,
      `linked in all ${images.length} slice/architecture ${plural(images.length, 'pair')} of ` +
        `${artifact.path}`
    );
  }

  return fail(
    'runtime-link',
    dependency,
    `In ${artifact.path}, ${missing.map((image) => image.label).join(', ')} ` +
      `${missing.length === 1 ? 'does' : 'do'} not link ${installName}, while ` +
      `${images.length - missing.length} of ${images.length} slice/architecture pairs do. A ` +
      `dependency present on one architecture and absent on another fails only on the device or ` +
      `simulator that needs the missing one. Inspect it with \`otool -arch <arch> -L <binary>\` ` +
      `and compare against a known-good build.`
  );
}

/** The shape of `swift package dump-package` output, in the parts these checks read. */
interface DumpedManifest {
  dependencies?: { sourceControl?: { location?: { remote?: { urlString: string }[] } }[] }[];
  targets?: { name: string; type: string; path?: string | null; url?: string | null }[];
}

/**
 * The dump writes a `.build` directory beside the manifest it reads, and a generated manifest lives
 * inside the prebuild's own build tree, so the read happens on a copy in a scratch directory. The
 * manifest needs nothing beside it: evaluating it resolves no dependency and touches no network.
 */
function dumpPackage(manifestPath: string): DumpedManifest {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-manifest-dump-'));
  try {
    fs.copyFileSync(manifestPath, path.join(workspace, 'Package.swift'));
    const { status, stdout, stderr, error } = spawnSync(
      'swift',
      ['package', 'dump-package', '--package-path', workspace],
      { cwd: workspace, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
    );

    if (error || status !== 0) {
      throw new Error(
        `Could not read ${manifestPath}: \`swift package dump-package\` ` +
          `${error ? `did not run (${error.message})` : `exited with status ${status}`}. ` +
          `${(stderr ?? '').trim()}\n` +
          `The dependency checks read the manifest through SwiftPM rather than scanning its text, ` +
          `because only SwiftPM tells a declaration apart from one quoted in a comment or a ` +
          `string. Check that the path points at a Package.swift SwiftPM can evaluate, and that ` +
          `a Swift toolchain is installed (\`swift --version\`).`
      );
    }

    return JSON.parse(stdout) as DumpedManifest;
  } finally {
    fs.removeSync(workspace);
  }
}

/**
 * The flavor directory a binary target's path names, once `..` has had its say.
 *
 * The flavor nearest the artifact is the one that built it: in
 * `../release/.spm-deps/SDWebImage/debug/SDWebImage.xcframework` the artifact is the debug one,
 * and reading the first segment instead reports the opposite. A path naming both is refused
 * rather than resolved, because this check exists to catch a manifest that does not describe this
 * build, and picking either reading would assume the emitter got the other one right.
 */
function flavorDirectoryOf(target: SwiftBinaryTarget, manifestPath: string): string | null {
  const named = (target.relativePath?.split(path.sep) ?? []).filter(
    (segment) => segment === 'debug' || segment === 'release'
  );
  const nearest = named.at(-1) ?? null;

  if (new Set(named).size > 1) {
    throw new Error(
      `${manifestPath} declares \`.binaryTarget(name: "${target.name}", ` +
        `path: "${target.location}")\`, which resolves to ${target.relativePath} — a path naming ` +
        `two build flavors: ${named.join(', then ')} nearest the artifact. A generated manifest ` +
        `is tied to a build only by those paths, so one naming both says nothing about which ` +
        `build it describes, and resolving it either way would let another build's dependency ` +
        `declarations vouch for these artifacts. Fix the binary target path so it names one ` +
        `flavor, or pass --manifest with the Package.swift that produced this build.`
    );
  }

  return nearest;
}

/** A remote binary target names a zipped xcframework; a local one names the xcframework itself. */
function artifactName(target: SwiftBinaryTarget): string {
  return path.basename(target.location).replace(/\.zip$/, '');
}

function describeBinary(binaryPath: string): string {
  // …/<Product>.xcframework/<slice>/<Product>.framework/<Product>
  const slice = path.basename(path.dirname(path.dirname(binaryPath)));
  return slice || binaryPath;
}

function sharedSpmDepFrameworkPath(input: SpmPackagesCheckInput, productName: string): string {
  return path.join(
    input.sharedSpmDepsRoot,
    productName,
    input.flavor.toLowerCase(),
    `${productName}.xcframework`
  );
}

/** Runs `otool -arch <arch> -L` once per architecture, so a fat binary cannot hide a gap. */
function readLinkedLibrariesWithOtool(binaryPath: string): Map<string, string[]> {
  return new Map(
    readArchitectures(binaryPath).map((architecture) => {
      const { status, stdout, stderr, error } = spawnSync(
        'otool',
        ['-arch', architecture, '-L', binaryPath],
        { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
      );

      if (error || status !== 0) {
        throw new Error(
          `Could not list the libraries linked by ${binaryPath} (${architecture}): ` +
            `${(error?.message ?? stderr ?? '').trim() || `otool exited with status ${status}`}. ` +
            `The SPM dependency check reads \`otool -L\` to confirm the product still links its ` +
            `dependencies. Check that the path points at a framework binary rather than the ` +
            `.framework directory, and that the Xcode command line tools are installed.`
        );
      }

      return [architecture, parseOtoolLibraries(stdout)];
    })
  );
}

function pass(
  check: SpmPackagesCheckName,
  dependency: SpmDependencyRef,
  message: string
): SpmPackageDiagnostic {
  return { check, dependency: dependency.productName, status: 'pass', message };
}

function fail(
  check: SpmPackagesCheckName,
  dependency: SpmDependencyRef,
  message: string
): SpmPackageDiagnostic {
  return { check, dependency: dependency.productName, status: 'fail', message };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}
