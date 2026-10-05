import fs from 'fs';
import path from 'path';

import { findModulesAsync } from './autolinking/findModules';
import type { LinkingOptionsLoader } from './commands/autolinkingOptions';
import { scanDependenciesInSearchPath } from './dependencies';
import { createMemoizer } from './memoize';
import { createReactNativeConfigAsync } from './reactNativeConfig';
import type { RNConfigDependency } from './reactNativeConfig/reactNativeConfig.types';
import { scanFilesRecursively } from './utils';

export interface PrebuiltMetadataEntry extends PrebuiltProductFields {
  type: 'internal' | 'external';
  npmPackage: string;
  packageRoot: string;
  podspecDir: string;
  productName: string;
}

/** The fields read from a product's spm.config.json entry. Each needs a reader in
 * `PRODUCT_FIELD_READERS`, which the compiler enforces. */
export interface PrebuiltProductFields {
  /** The product is built from source only — the prebuild pipeline never
   * produces an XCFramework for it. Absent where it does. */
  sourceOnly?: boolean;
  /** The product's iOS deployment floor as a plain version string ("16.4").
   * Absent where the config declares none this can read. */
  iosDeploymentTarget?: string;
  /** The SPM packages the product links. A consumer of the precompiled product
   * links each one as the XCFramework named after its `productName`, shipped
   * beside the product; a consumer building from source declares the package.
   * Absent where the product declares none this can render. */
  spmPackages?: PrebuiltSpmPackage[];
  /** The gate deciding whether the product is linked at all, present whenever
   * the product declares one — a gate this could not read whole is a gate that
   * is never met, not an absent one. Absent where the product declares none. */
  autolinkWhen?: PrebuiltAutolinkWhen;
}

export type PrebuiltSpmVersion =
  | { exact: string }
  | { from: string }
  | { branch: string }
  | { revision: string };

export interface PrebuiltSpmPackage {
  url: string;
  productName: string;
  version: PrebuiltSpmVersion;
}

/** A companion product's autolinking gate, as Ruby's
 * `companion_autolink_condition_met?` and its port in
 * `expo/scripts/spm/autolink-gate.js` evaluate it: the first subject the
 * condition declares decides it and the rest are never read — `podName` (a pod
 * this install emits), then `npmPackage` (a package the app autolinks), then
 * `podfileProperty` (set to anything but `disabledValue`). A condition
 * declaring no subject is never met, so an unreadable gate withholds its
 * product rather than releasing it. `disabledValue` qualifies only
 * `podfileProperty` and keeps whatever the config gave it, of whatever type:
 * it is compared against a property value, never rendered, and narrowing it
 * would answer a comparison differently from CocoaPods.
 *
 * The comparison is strict equality, which agrees with Ruby's `!=` on every
 * scalar but not on containers — Ruby holds two equal-valued hashes equal
 * where JavaScript compares them by identity. A Podfile property is a string
 * in practice, so this limit is unreachable; do not close it with a deep
 * equality neither integration promises. */
export interface PrebuiltAutolinkWhen {
  podName?: string;
  npmPackage?: string;
  podfileProperty?: string;
  disabledValue?: unknown;
}

export type PrebuiltMetadataDocument = Record<string, PrebuiltMetadataEntry>;

export interface ResolvePrebuiltMetadataOptions {
  /** 'catalog' scans the expo repository's packages/ tree (app-independent);
   * 'app-plan' locates configs through the app's module resolution.
   * Defaults to 'catalog' inside an expo repository checkout, 'app-plan' elsewhere. */
  mode?: 'catalog' | 'app-plan';
}

/** Package identity as both discovery modes already report it. */
type DiscoveredPackages = Record<string, { path: string } | undefined>;

/** Resolves the prebuilt-modules metadata document (ENG-25370): the identity
 * join between npm packages, pods, and products, for internal and external
 * products. */
export async function resolvePrebuiltMetadataAsync(
  optionsLoader: LinkingOptionsLoader,
  { mode }: ResolvePrebuiltMetadataOptions = {}
): Promise<PrebuiltMetadataDocument> {
  return createMemoizer().withMemoizer(async () => {
    const appRoot = await optionsLoader.getAppRoot();
    const resolvedMode = mode ?? (findExpoRepoRoot() ? 'catalog' : 'app-plan');
    const packages =
      resolvedMode === 'catalog'
        ? await scanRepoPackagesAsync()
        : await findAppPackagesAsync(appRoot, optionsLoader);

    const entries: PrebuiltMetadataDocument = {};
    for (const name of Object.keys(packages).sort()) {
      const packageRoot = packages[name]?.path;
      if (packageRoot) {
        addInternalProducts(entries, packageRoot);
      }
    }

    const reactNativeConfig = await createReactNativeConfigAsync({
      autolinkingOptions: await optionsLoader.getPlatformOptions('ios'),
      appRoot,
      sourceDir: undefined,
    });
    await scanExternalConfigsAsync(reactNativeConfig.dependencies ?? {}, entries);

    return Object.fromEntries(
      Object.keys(entries)
        .sort()
        .map((podName) => [podName, entries[podName]!])
    );
  });
}

/** The expo repository root when this package runs from its packages/ checkout
 * (its own location is the same anchor used for external-configs below). */
function findExpoRepoRoot(): string | null {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  return fs.existsSync(path.join(repoRoot, 'packages', 'expo-modules-core', 'spm.config.json'))
    ? repoRoot
    : null;
}

/** Every package in the expo repository, whether or not an app depends on it. */
async function scanRepoPackagesAsync(): Promise<DiscoveredPackages> {
  const repoRoot = findExpoRepoRoot();
  if (!repoRoot) {
    throw new Error(
      'The prebuilt-metadata catalog requires an expo repository checkout. Use the app-plan mode for standalone projects.'
    );
  }
  return scanDependenciesInSearchPath(path.join(repoRoot, 'packages'));
}

/** Only the packages the app itself resolves. */
async function findAppPackagesAsync(
  appRoot: string,
  optionsLoader: LinkingOptionsLoader
): Promise<DiscoveredPackages> {
  return findModulesAsync({
    appRoot,
    autolinkingOptions: await optionsLoader.getPlatformOptions('apple'),
  });
}

function readJsonFile(filePath: string): any | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`[prebuilt-metadata] Failed to read ${filePath}: ${error}`);
    return null;
  }
}

const IOS_PLATFORM_RX = /^iOS\(\s*(?:["']([\d.]+)["']|\.v(\d+))\s*\)$/;

/**
 * The iOS floor of an spm.config.json `platforms` array, as a plain version
 * string: `iOS(.v15)` and `iOS("15.0")` are the same floor to every consumer, and
 * only a Package.swift can spell the case form. A declaration this cannot read is
 * no floor at all — a guessed deployment target is a compile error in someone
 * else's module.
 */
function readIosDeploymentTarget(platforms: unknown): string | undefined {
  if (!Array.isArray(platforms)) {
    return undefined;
  }
  for (const platform of platforms) {
    if (typeof platform !== 'string' || !platform.trim().startsWith('iOS(')) {
      continue;
    }
    const match = IOS_PLATFORM_RX.exec(platform.trim());
    return match == null ? undefined : (match[1] ?? `${match[2]}.0`);
  }
  return undefined;
}

const SPM_VERSION_KEYS = ['exact', 'from', 'branch', 'revision'] as const;

/** An SPM version requirement, when the entry declares exactly one this knows and
 * spells it as a string. Two requirements are as unrenderable as none. */
function readSpmVersion(version: unknown): PrebuiltSpmVersion | undefined {
  if (typeof version !== 'object' || version === null) {
    return undefined;
  }
  const declared = SPM_VERSION_KEYS.filter((key) => key in version);
  const requirement = declared.length === 1 ? declared[0] : undefined;
  if (requirement == null) {
    return undefined;
  }
  const value = (version as Record<string, unknown>)[requirement];
  return typeof value === 'string' ? ({ [requirement]: value } as PrebuiltSpmVersion) : undefined;
}

/** The SPM packages of a product, as the coordinates a generated manifest needs.
 * An entry missing any of them, or naming one as an empty string, is skipped: a
 * package declaration SwiftPM cannot resolve fails the whole graph, where a
 * missing one is diagnosed by name. An
 * entry naming a package identity of its own is skipped for the same reason —
 * SwiftPM derives identity from the URL, and no manifest can say otherwise. */
function readSpmPackages(
  spmPackages: unknown,
  { podName, configPath }: ProductContext
): PrebuiltSpmPackage[] | undefined {
  if (!Array.isArray(spmPackages)) {
    return undefined;
  }
  const packages: PrebuiltSpmPackage[] = [];
  spmPackages.forEach((entry: unknown, index) => {
    const read = readSpmPackage(entry);
    if (typeof read !== 'string') {
      packages.push(read);
      return;
    }
    const productName = (entry as { productName?: unknown } | null)?.productName;
    const label = isNonEmptyString(productName) ? `"${productName}"` : `spmPackages[${index}]`;
    warnSkippedSpmPackage(label, podName, configPath, read);
  });
  return packages.length > 0 ? packages : undefined;
}

/** The package an entry declares, or what keeps it from declaring one. */
function readSpmPackage(entry: unknown): PrebuiltSpmPackage | string {
  if (typeof entry !== 'object' || entry === null) {
    return 'is not an object';
  }
  const { url, productName, version } = entry as Record<string, unknown>;
  if (!isNonEmptyString(productName)) {
    return 'has no productName';
  }
  if (!isNonEmptyString(url)) {
    return 'has no url';
  }
  const requirement = readSpmVersion(version);
  if (requirement == null) {
    return 'declares no version requirement this can read (exactly one of exact, from, branch or revision, as a string)';
  }
  if ('packageName' in entry) {
    return 'names a packageName, which SwiftPM derives from the url instead';
  }
  return { url, productName, version: requirement };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** CocoaPods links every SPM package that names a product, so one skipped here
 * without a word is linked by CocoaPods and silently missing from a SwiftPM build. */
function warnSkippedSpmPackage(
  label: string,
  podName: string,
  configPath: string,
  problem: string
) {
  console.warn(
    `[prebuilt-metadata] The SPM package ${label} of ${podName} in ${configPath} ${problem}, so it is left out of the metadata ` +
      'and a SwiftPM build does not link it, even where CocoaPods does. ' +
      'Give the entry a url, a productName, and exactly one version requirement, and no packageName.'
  );
}

const AUTOLINK_WHEN_SUBJECTS = ['podName', 'npmPackage', 'podfileProperty'] as const;

type AutolinkWhenSubject = (typeof AUTOLINK_WHEN_SUBJECTS)[number];

function isAutolinkWhenSubject(key: string): key is AutolinkWhenSubject {
  return (AUTOLINK_WHEN_SUBJECTS as readonly string[]).includes(key);
}

/** The autolinking gate a product declares, keeping only the keys an evaluator
 * reads. A declared gate always survives as a condition, even an empty one:
 * both evaluators answer "not met" for a condition naming no subject, so
 * dropping the key here would link under SwiftPM what CocoaPods leaves out —
 * the parity this document exists to keep. */
function readAutolinkWhen(
  condition: unknown,
  podName: string,
  configPath: string
): PrebuiltAutolinkWhen | undefined {
  if (condition == null) {
    return undefined;
  }
  if (typeof condition !== 'object' || Array.isArray(condition)) {
    warnUnreadableAutolinkWhen(
      podName,
      configPath,
      [`is ${Array.isArray(condition) ? 'an array' : `a ${typeof condition}`}, not an object`],
      false
    );
    return {};
  }

  const declared: PrebuiltAutolinkWhen = {};
  const unread: string[] = [];
  for (const [key, value] of Object.entries(condition as Record<string, unknown>)) {
    if (key === 'disabledValue') {
      declared.disabledValue = value;
      continue;
    }
    if (isAutolinkWhenSubject(key) && typeof value === 'string') {
      declared[key] = value;
      continue;
    }
    unread.push(key);
  }

  const hasSubject = AUTOLINK_WHEN_SUBJECTS.some((subject) => declared[subject] != null);
  const problems =
    unread.length > 0 ? [`declares ${unread.join(', ')}, which this cannot read`] : [];
  if (!hasSubject) {
    problems.push('names no podName, npmPackage, or podfileProperty to test');
  }
  if (problems.length > 0) {
    warnUnreadableAutolinkWhen(podName, configPath, problems, hasSubject);
  }
  return declared;
}

/** A gate nobody warns about fails silently: the module is simply missing from
 * the build, with no diagnostic anywhere naming the condition that withheld it. */
function warnUnreadableAutolinkWhen(
  podName: string,
  configPath: string,
  problems: string[],
  hasSubject: boolean
) {
  console.warn(
    `[prebuilt-metadata] The autolinkWhen condition of ${podName} in ${configPath} ${problems.join(' and ')}. ` +
      (hasSubject
        ? 'The rest of the condition still decides the gate.'
        : 'A condition naming no subject is never met, so the product is left out of the build.') +
      ' Check the condition for a typo.'
  );
}

/** An spm.config.json product as parsed; nothing beyond its names is trusted. */
interface SpmConfigProduct {
  podName?: string;
  name?: string;
  [key: string]: unknown;
}

interface ProductContext {
  podName: string;
  configPath: string;
}

type ProductFieldReaders = {
  [Field in keyof PrebuiltProductFields]-?: (
    product: SpmConfigProduct,
    context: ProductContext
  ) => PrebuiltProductFields[Field];
};

/** Declaration order is the document's key order. */
const PRODUCT_FIELD_READERS: ProductFieldReaders = {
  sourceOnly: (product) => (product.sourceOnly === true ? true : undefined),
  iosDeploymentTarget: (product) => readIosDeploymentTarget(product.platforms),
  spmPackages: (product, context) => readSpmPackages(product.spmPackages, context),
  autolinkWhen: (product, { podName, configPath }) =>
    readAutolinkWhen(product.autolinkWhen, podName, configPath),
};

function readProductFields(
  product: SpmConfigProduct,
  context: ProductContext
): PrebuiltProductFields {
  const fields: Record<string, unknown> = {};
  for (const [field, read] of Object.entries(PRODUCT_FIELD_READERS)) {
    const value = read(product, context);
    if (value !== undefined) {
      fields[field] = value;
    }
  }
  return fields as PrebuiltProductFields;
}

interface ProductSource {
  type: PrebuiltMetadataEntry['type'];
  npmPackage: string;
  packageRoot: string;
  podspecDir: (podName: string) => string;
  configPath: string;
}

function addProducts(
  entries: PrebuiltMetadataDocument,
  config: { products?: SpmConfigProduct[] } | null,
  source: ProductSource
) {
  const { configPath } = source;
  // Like Ruby, a config that fails mid-processing is warned about and skipped.
  try {
    for (const product of config?.products ?? []) {
      const podName = product.podName;
      if (podName == null) {
        continue;
      }
      entries[podName] = {
        type: source.type,
        npmPackage: source.npmPackage,
        packageRoot: source.packageRoot,
        podspecDir: source.podspecDir(podName),
        productName: product.name || podName,
        ...readProductFields(product, { podName, configPath }),
      };
    }
  } catch (error) {
    console.warn(`[prebuilt-metadata] Failed to process ${configPath}: ${error}`);
  }
}

function addInternalProducts(entries: PrebuiltMetadataDocument, packageRoot: string) {
  const configPath = path.join(packageRoot, 'spm.config.json');
  const config = readJsonFile(configPath);
  if (!config) {
    return;
  }
  // Both resolvers synthesize a name from the directory when package.json cannot be
  // read, so the npm name is only trustworthy from the manifest itself. Like Ruby,
  // skip the config rather than emit a name derived from the path.
  const npmPackage = readJsonFile(path.join(packageRoot, 'package.json'))?.name;
  if (!npmPackage) {
    return;
  }
  addProducts(entries, config, {
    type: 'internal',
    npmPackage,
    packageRoot,
    podspecDir: (podName) => resolvePodspecDir(packageRoot, podName),
    configPath,
  });
}

/** Podspecs live in `ios/` unless the package keeps one at its root. */
function resolvePodspecDir(packageRoot: string, podName: string): string {
  return !fs.existsSync(path.join(packageRoot, 'ios', `${podName}.podspec`)) &&
    fs.existsSync(path.join(packageRoot, `${podName}.podspec`))
    ? packageRoot
    : path.join(packageRoot, 'ios');
}

async function scanExternalConfigsAsync(
  dependencies: Record<string, RNConfigDependency>,
  entries: PrebuiltMetadataDocument
) {
  const externalConfigsDir = path.join(__dirname, '..', 'external-configs', 'ios');
  for await (const file of scanFilesRecursively(externalConfigsDir, undefined, true)) {
    if (file.name !== 'spm.config.json') {
      continue;
    }
    const npmPackage = path.relative(externalConfigsDir, file.parentPath).split(path.sep).join('/');
    const packageRoot = dependencies[npmPackage]?.root;
    if (!packageRoot) {
      continue;
    }
    addProducts(entries, readJsonFile(file.path), {
      type: 'external',
      npmPackage,
      packageRoot,
      podspecDir: () => packageRoot,
      configPath: file.path,
    });
  }
}
