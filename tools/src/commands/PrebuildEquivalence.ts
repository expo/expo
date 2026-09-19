import { Command } from '@expo/commander';
import fs from 'fs-extra';
import path from 'path';

import { getExternalPackagesDir, getPackagesDir } from '../Directories';
import { Frameworks } from '../prebuilds/Frameworks';
import type { BuildFlavor } from '../prebuilds/Prebuilder.types';
import {
  ARTIFACT_PATH_LAYOUTS,
  parseArtifactPath,
  type ArtifactContext,
} from '../prebuilds/equivalence/ArtifactPath';
import {
  assertManifestMatchesFlavor,
  assertSpmPackagesResolved,
  formatSpmPackageDiagnostics,
  readSwiftManifest,
  type InspectedArtifact,
  type SpmDependencyRef,
  type SpmPackagesCheckInput,
} from '../prebuilds/equivalence/SpmPackagesCheck';
import {
  compareXCFrameworks,
  formatEquivalenceReport,
} from '../prebuilds/equivalence/XCFrameworkComparison';

export type EquivalenceOptions = {
  labelA: string;
  labelB: string;
  package?: string;
  product?: string;
  flavor?: string;
  manifest?: string;
  buildLog?: string;
  allowMissingBuildLog: boolean;
  skipSpmPackagesCheck: boolean;
};

export type SpmCheckOptions = Pick<
  EquivalenceOptions,
  'package' | 'product' | 'flavor' | 'manifest' | 'buildLog'
> & { skipSpmPackagesCheck?: boolean };

type ProductConfig = { name: string; spmPackages?: SpmDependencyRef[] };

/** The product a run checks, and the declaration it was read from. */
export interface ResolvedProduct {
  /** The `spm.config.json` that declared it, named in the report so it can be opened. */
  configPath: string;
  product: ProductConfig;
  /** The other products of the same config, which decide whether this package has dependencies. */
  siblings: ProductConfig[];
}

/**
 * Either the input the SPM dependency check runs on, or the sentence the report prints in its
 * place. A product declaring no `spmPackages` is legitimate and permanent; a run that silently
 * dropped the only check that catches a dropped dependency is not.
 */
export type SpmPackagesCheckPlan =
  | { checked: true; input: SpmPackagesCheckInput }
  | { checked: false; reason: string };

/** The two directories an `spm.config.json` can live in. Passed in so tests can supply a tree. */
export interface ConfigRoots {
  /** `packages/`, holding a first-party package's config at `<package>/spm.config.json`. */
  packagesDir: string;
  /** `external-configs/ios/`, holding the config of a third-party package. */
  externalPackagesDir: string;
}

export function repoConfigRoots(): ConfigRoots {
  return { packagesDir: getPackagesDir(), externalPackagesDir: getExternalPackagesDir() };
}

/** What the command reaches outside itself for, injected so a test can pin what ran, and when. */
export interface EquivalenceRuntime {
  compare: typeof compareXCFrameworks;
  configRoots: () => ConfigRoots;
  log: (message: string) => void;
}

const commandRuntime: EquivalenceRuntime = {
  compare: compareXCFrameworks,
  configRoots: repoConfigRoots,
  log: (message) => console.log(message),
};

/** Runs one comparison and returns the exit code it deserves. */
export function runPrebuildEquivalence(
  pathA: string,
  pathB: string,
  options: EquivalenceOptions,
  runtime: EquivalenceRuntime = commandRuntime
): number {
  const outcome = decideEquivalence(path.resolve(pathA), path.resolve(pathB), options, runtime);
  outcome.lines.forEach(runtime.log);
  return outcome.exitCode;
}

/** A finished verdict: what the operator will read, and what the shell will see. */
interface EquivalenceOutcome {
  exitCode: number;
  lines: string[];
}

/**
 * Decides the run and formats every line of it, printing none of them.
 *
 * No output is printed until all checks finish. The leading line combines the artifact and
 * dependency outcomes; the detailed artifact verdict alone cannot describe the whole run.
 */
function decideEquivalence(
  pathA: string,
  pathB: string,
  options: EquivalenceOptions,
  runtime: Omit<EquivalenceRuntime, 'log'>
): EquivalenceOutcome {
  const plan = resolveSpmPackagesCheck(options, pathA, pathB, runtime.configRoots());
  const report = runtime.compare(pathA, pathB, {
    labelA: options.labelA,
    labelB: options.labelB,
  });
  if (!plan.checked) {
    const outcome = report.equivalent ? 'Passed' : 'Failed';
    return {
      exitCode: report.equivalent ? 0 : 1,
      lines: [
        `${outcome} — artifacts ${report.equivalent ? 'equivalent' : 'not equivalent'}; SPM dependency check did not run.\n` +
          formatEquivalenceReport(report),
        plan.reason,
      ],
    };
  }

  const { product, flavor } = plan.input;
  const diagnostics = assertSpmPackagesResolved(plan.input);
  const spmPackagesOk = diagnostics.every(
    (diagnostic) =>
      diagnostic.status === 'pass' ||
      (diagnostic.status === 'skipped' && options.allowMissingBuildLog)
  );

  const passed = report.equivalent && spmPackagesOk;
  return {
    exitCode: passed ? 0 : 1,
    lines: [
      `${passed ? 'Passed' : 'Failed'} — artifacts ${report.equivalent ? 'equivalent' : 'not equivalent'}; ` +
        `SPM dependency check ${spmPackagesOk ? 'passed' : 'failed or incomplete'}.\n` +
        formatEquivalenceReport(report),
      `SPM package dependencies of ${product} (${flavor}), read from both artifacts:`,
      formatSpmPackageDiagnostics(diagnostics),
      '',
      ...(!spmPackagesOk && diagnostics.every((d) => d.status !== 'fail')
        ? [
            'Some conditions above were not verified. Pass --build-log with the captured build ' +
              'output, or --allow-missing-build-log to accept the gap.\n',
          ]
        : []),
    ],
  };
}

/**
 * Establishes everything that can refuse a run, and either the input the `spmPackages` check runs
 * on or the reason it will not run.
 *
 * The check is on by default: a dropped SPM dependency leaves the product's own symbols untouched,
 * so the comparison alone reports `Equivalent` on a broken build. Even `--skip-spm-packages-check`
 * comes through here, so that there is one place where every refusal has happened and no flag
 * routes around the agreement checks.
 */
export function resolveSpmPackagesCheck(
  options: SpmCheckOptions,
  pathA: string,
  pathB: string,
  roots: ConfigRoots
): SpmPackagesCheckPlan {
  const build = assertSameBuild(pathA, pathB);
  const { packageName, flavor } = assertOverridesAgree(options, build);

  if (options.skipSpmPackagesCheck) {
    const config = readProductConfig(roots, packageName);
    const withPackages = config?.products.filter((product) => product.spmPackages?.length) ?? [];
    return {
      checked: false,
      reason:
        `The SPM dependency check was skipped with --skip-spm-packages-check, so nothing here ` +
        `rules out a silently dropped SwiftPM dependency: dropping one leaves the product's own ` +
        `symbols and interface untouched, which is all the comparison above read. ` +
        (withPackages.length > 0
          ? `${config!.configPath} declares ${listNames(withPackages)} with spmPackages. `
          : '') +
        `Drop the flag ` +
        `and pass --manifest with the Package.swift that produced this build to check it.\n`,
    };
  }

  const resolved = resolveProduct(roots, packageName, {
    requested: options.product,
    artifactName: build.artifactName,
  });
  const product = resolved.product;
  if (!product.spmPackages?.length) {
    return {
      checked: false,
      reason: explainUncheckedProduct(options, packageName, build.artifactName, resolved),
    };
  }

  if (!options.manifest) {
    throw new Error(
      `${product.name} declares spmPackages, and --manifest was not passed. The generator writes ` +
        `one manifest per product, at ` +
        `packages/precompile/.build/${packageName}/generated/${product.name}/Package.swift, and ` +
        `every flavor and every build mode overwrites it — so the manifest on disk cannot be ` +
        `trusted to describe these ${flavor} artifacts, and reading it would let another build's ` +
        `dependency declarations vouch for this one. Pass --manifest pointing at the ` +
        `Package.swift that produced this build, or --skip-spm-packages-check to compare the ` +
        `artifacts only.`
    );
  }
  const manifest = readSwiftManifest(options.manifest);
  assertManifestMatchesFlavor(manifest, flavor);

  return {
    checked: true,
    input: {
      product: product.name,
      flavor,
      spmPackages: product.spmPackages,
      manifest,
      sharedSpmDepsRoot: Frameworks.getSharedSPMDepsRoot(),
      buildLog: options.buildLog ? readBuildLog(options.buildLog) : '',
      artifacts: [pathA, pathB].map((artifact, index) =>
        inspectArtifact(artifact, index === 0 ? 'A' : 'B')
      ),
    },
  };
}

/**
 * Says why the dependency check will not run — and refuses the one shape in which `--product` is
 * the only thing switching it off.
 *
 * The artifact basename is not an identifier: `EXApplication.xcframework` is built by
 * `ExpoApplication`, so it normally corroborates nothing. But when it names neither the selected
 * product nor any other declared one, and a sibling product of the same package does declare
 * `spmPackages`, nothing at all ties these artifacts to the product whose (empty) dependency list
 * is about to stand in for them.
 */
function explainUncheckedProduct(
  options: SpmCheckOptions,
  packageName: string,
  artifactName: string,
  { configPath, product, siblings }: ResolvedProduct
): string {
  const withPackages = siblings.filter((sibling) => sibling.spmPackages?.length);

  if (options.product && artifactName !== product.name && withPackages.length > 0) {
    throw new Error(
      `-n/--product says ${product.name}, which declares no spmPackages, and the artifacts are ` +
        `named ${artifactName}.xcframework. That combination switches off the only check that ` +
        `catches a silently dropped dependency, on a package that has dependencies to drop: ` +
        `${configPath} declares ${listNames(withPackages)} with spmPackages, and the artifact ` +
        `name says nothing about which product built it. Drop -n/--product so the artifacts pick ` +
        `the product, pass -n/--product ${withPackages[0].name} if that is what these artifacts ` +
        `are, or pass --skip-spm-packages-check to compare the artifacts only and have the report ` +
        `say so.`
    );
  }

  return (
    `${product.name} declares no spmPackages in ${configPath}, so the SPM dependency check did ` +
    `not run and only the comparison above vouches for this build.` +
    (withPackages.length > 0
      ? ` Other products of ${packageName} do declare them — ${listNames(withPackages)} — so pass ` +
        `-n/--product with one of those if these artifacts came from it.`
      : '') +
    '\n'
  );
}

function listNames(products: ProductConfig[]): string {
  return products.map((product) => product.name).join(', ');
}

/**
 * Asserts that two paths name two builds of the same package, flavor and product, and returns what
 * they agree on.
 *
 * A run checks both artifacts against one package, flavor and product, so two paths that describe
 * different builds would have B silently checked against A's configuration. That makes agreement a
 * precondition of the whole comparison rather than of the dependency check, which is why this runs
 * before the artifacts are compared and why no flag skips it.
 */
function assertSameBuild(pathA: string, pathB: string): ArtifactContext {
  const a = readArtifactContext(pathA, pathB);
  const b = readArtifactContext(pathB, pathA);

  const disagreements = (
    [
      ['package', a.packageName, b.packageName],
      ['flavor', a.flavor, b.flavor],
      ['artifact', a.artifactName, b.artifactName],
    ] as const
  ).filter(([, valueA, valueB]) => valueA !== valueB);

  if (disagreements.length === 0) {
    return a;
  }

  throw new Error(
    `${pathA} and ${pathB} are not two builds of the same thing: ` +
      disagreements.map(([field, valueA, valueB]) => `${field} ${valueA} vs ${valueB}`).join(', ') +
      `. The SPM dependency check reads one package, flavor and product for both sides, so the ` +
      `second artifact would be checked against the first one's configuration and the result ` +
      `would read as if it described both. Point both paths at the same product and flavor, ` +
      `built two ways.`
  );
}

/** A path the parser cannot place carries no evidence, and evidence is what the run reports on. */
function readArtifactContext(xcframeworkPath: string, otherPath: string): ArtifactContext {
  const artifact = parseArtifactPath(xcframeworkPath);
  if (artifact) {
    return artifact;
  }

  throw new Error(
    `${xcframeworkPath} is not a prebuild output path, so there is no telling which package, ` +
      `flavor and product it holds, nor whether it and ${otherPath} are two builds of the same ` +
      `thing. An artifact the command cannot place is not a passing one: it would be compared, ` +
      `and reported on, as whatever the other path turned out to be. Point both paths at a ` +
      `prebuild output — ${ARTIFACT_PATH_LAYOUTS.join(', or ')} — keeping the whole tail when ` +
      `you copy an artifact aside.`
  );
}

/**
 * Reads the package and flavor the run works on, refusing an override that the artifacts contradict
 * — a false statement about the artifacts invalidates the run, so this happens before they are
 * compared.
 */
function assertOverridesAgree(
  options: SpmCheckOptions,
  build: ArtifactContext
): { packageName: string; flavor: BuildFlavor } {
  return {
    packageName: assertOverrideAgrees('--package', options.package, build.packageName),
    flavor: assertOverrideAgrees(
      '-f/--flavor',
      options.flavor !== undefined ? parseFlavor(options.flavor) : undefined,
      build.flavor
    ),
  };
}

/** An override may supply what the artifact paths do not carry; it may never contradict them. */
function assertOverrideAgrees<T extends string>(
  option: string,
  override: T | undefined,
  fromPaths: T
): T {
  if (override !== undefined && override !== fromPaths) {
    throw new Error(
      `${option} says ${override}, and the artifact paths say ${fromPaths}. The run reads one ` +
        `package, flavor and product for both artifacts, and it reads them from the paths, so an ` +
        `override that contradicts them would have these artifacts vouched for by another ` +
        `build's manifest and another flavor's prepared dependencies. Drop ${option}, or point ` +
        `the paths at the ${override} artifacts.`
    );
  }
  return fromPaths;
}

/**
 * Finds the product whose `spmPackages` the artifacts should be checked against.
 *
 * `artifactName` is the `.xcframework` basename, which is a hint and not an identifier:
 * `EXApplication.xcframework` is built by the product `ExpoApplication`, and that holds for much
 * of the corpus. It is used only to disambiguate a package declaring several products.
 */
export function resolveProduct(
  roots: ConfigRoots,
  packageName: string,
  names: { requested?: string; artifactName?: string }
): ResolvedProduct {
  const config = readProductConfig(roots, packageName);
  if (!config) {
    const candidates = configCandidates(roots, packageName);
    throw new Error(
      `There is no spm.config.json for ${packageName}: neither ${candidates[0]} nor ` +
        `${candidates[1]} exists. The SPM dependency check is the only one that catches a ` +
        `silently dropped dependency, so a package it cannot read is an error rather than a ` +
        `pass. Check the spelling of --package, or pass --skip-spm-packages-check if this ` +
        `package has no spm.config.json.`
    );
  }
  const { configPath, products } = config;
  const declared = listNames(products) || 'no products';
  const resolve = (product: ProductConfig): ResolvedProduct => ({
    configPath,
    product,
    siblings: products.filter((candidate) => candidate !== product),
  });

  if (names.requested) {
    const requested = products.find((candidate) => candidate.name === names.requested);
    if (!requested) {
      throw new Error(
        `${packageName} declares no product named "${names.requested}": ${configPath} declares ` +
          `${declared}. The SPM dependency check is per product, so it needs one that exists. ` +
          `Pass -n/--product with one of those names.`
      );
    }
    if (
      names.artifactName !== undefined &&
      names.artifactName !== requested.name &&
      products.some((candidate) => candidate.name === names.artifactName)
    ) {
      throw new Error(
        `-n/--product says ${requested.name}, while the artifacts are named ` +
          `${names.artifactName}.xcframework and ${packageName} declares ${names.artifactName} as ` +
          `a product of its own. A framework name and the product name that built it often ` +
          `differ, so the two disagreeing is normally no evidence — but here the artifact names a ` +
          `different declared product, and ${requested.name}'s dependencies say nothing about ` +
          `it. Drop -n/--product, or pass the artifacts that ${requested.name} built.`
      );
    }
    return resolve(requested);
  }

  if (products.length === 1) {
    return resolve(products[0]);
  }

  const matched = products.find((candidate) => candidate.name === names.artifactName);
  if (matched) {
    return resolve(matched);
  }

  throw new Error(
    `Could not tell which product of ${packageName} to check` +
      (names.artifactName
        ? `: the artifact is named ${names.artifactName}.xcframework, while ${configPath} declares ` +
          `${declared} — a framework name and the SPM product name that built it often differ`
        : `: ${configPath} declares ${declared}`) +
      `. The SPM dependency check is per product, so it needs exactly one. Pass -n/--product with ` +
      `the product that built this artifact.`
  );
}

function configCandidates(roots: ConfigRoots, packageName: string): string[] {
  return [roots.packagesDir, roots.externalPackagesDir].map((root) =>
    path.join(root, packageName, 'spm.config.json')
  );
}

function readProductConfig(
  roots: ConfigRoots,
  packageName: string
): { configPath: string; products: ProductConfig[] } | undefined {
  const configPath = configCandidates(roots, packageName).find((candidate) =>
    fs.existsSync(candidate)
  );
  if (!configPath) {
    return undefined;
  }
  try {
    const config: { products?: ProductConfig[] } = fs.readJsonSync(configPath);
    return { configPath, products: config.products ?? [] };
  } catch (error: unknown) {
    throw new Error(
      `Could not read ${configPath}: ${error instanceof Error ? error.message : String(error)}. ` +
        `The SPM dependency check needs this configuration to know which dependencies the product ` +
        `declares. Fix the file's JSON and read permissions, then run the comparison again.`
    );
  }
}

function readBuildLog(buildLog: string): string {
  try {
    return fs.readFileSync(buildLog, 'utf8');
  } catch (error: unknown) {
    throw new Error(
      `Could not read build log ${buildLog}: ${error instanceof Error ? error.message : String(error)}. ` +
        `The SPM dependency check needs the captured output to detect dropped-dependency warnings. ` +
        `Pass --build-log with a readable log from this build, or omit it and use ` +
        `--allow-missing-build-log to accept that gap.`
    );
  }
}

export function parseFlavor(value: string): BuildFlavor {
  const flavor = value.toLowerCase();
  if (flavor === 'debug') {
    return 'Debug';
  }
  if (flavor === 'release') {
    return 'Release';
  }
  throw new Error(
    `"${value}" is not a build flavor. A prebuild produces Debug or Release, and the SPM ` +
      `dependency check looks for the shared dependencies under that flavor's directory, so an ` +
      `unknown one would report every dependency as missing. Pass -f Debug or -f Release.`
  );
}

/**
 * Reads the slice binaries of one artifact, finding the framework by the xcframework's own
 * basename rather than by the product name: the product `ExpoApplication` builds
 * `EXApplication.xcframework`, and a slice can carry a second framework beside the product's.
 */
function inspectArtifact(xcframeworkPath: string, label: string): InspectedArtifact {
  if (!fs.existsSync(xcframeworkPath)) {
    throw new Error(
      `There is no xcframework at ${xcframeworkPath} (side ${label}). The equivalence check ` +
        `compares two built artifacts, so it cannot start without both. Build the package first ` +
        `(\`et prebuild <package> -f <flavor>\`) or point at an existing xcframework.`
    );
  }
  const framework = path.basename(xcframeworkPath, '.xcframework');
  const binaries = fs
    .readdirSync(xcframeworkPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((slice) => path.join(xcframeworkPath, slice.name, `${framework}.framework`, framework))
    .filter((candidate) => fs.existsSync(candidate));

  return { path: xcframeworkPath, binaries };
}

export default (program: Command) => {
  program
    .command('prebuild-equivalence <xcframeworkA> <xcframeworkB>')
    .description(
      'Compares two built `.xcframework`s on exported symbols, public interface and structure, and exits non-zero when they differ. Bytes, Info.plist contents, dSYMs and signatures are ignored: they differ between any two builds of the same source.\n' +
        'Also asserts that the product’s `spmPackages` dependencies reached the output, because a dropped SPM dependency leaves the product’s own symbols unchanged. That assertion reads both artifacts and reports each by path. The package is derived from the artifact path; override it with --package.'
    )
    .option('--label-a <label>', 'Name for the first artifact in the report.', 'A')
    .option('--label-b <label>', 'Name for the second artifact in the report.', 'B')
    .option(
      '--package <name>',
      'Package the artifacts were built from: a directory name under packages/, or the npm name of a third-party package configured in expo-modules-autolinking/external-configs/ios/. Read from the artifact paths; passing it asserts what they should say, and a disagreement is an error.'
    )
    .option('-n, --product <name>', 'Product to check when the package declares more than one.')
    .option(
      '-f, --flavor <flavor>',
      'Build flavor the artifacts were built with: Debug or Release. Read from the artifact paths; passing it asserts what they should say, and a disagreement is an error.'
    )
    .option(
      '--manifest <path>',
      'Generated Package.swift that produced these artifacts, to read the SPM dependency declarations from. Required when the product declares spmPackages: each flavor and build mode overwrites a product’s manifest, so there is no path the check can derive and trust.'
    )
    .option(
      '--build-log <path>',
      'Captured build output (`et prebuild … 2>&1 | tee build.log`). Needed to rule out the silent "SPM dependency not found in Build/Products/" warning.'
    )
    .option(
      '--allow-missing-build-log',
      'Exit 0 even though the build-log condition could not be checked. For a caller who genuinely has no log.',
      false
    )
    .option(
      '--skip-spm-packages-check',
      'Compare the artifacts only. Use when the product declares no spmPackages. Both paths must still be prebuild output paths: that the two artifacts are two builds of the same thing is checked either way.',
      false
    )
    .asyncAction(async (pathA: string, pathB: string, options: EquivalenceOptions) => {
      process.exitCode = runPrebuildEquivalence(pathA, pathB, options);
    });
};
