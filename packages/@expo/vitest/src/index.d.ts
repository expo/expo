import type { ViteUserConfig } from 'vitest/config';
import type { ResolveSnapshotPathHandler } from 'vitest/node';

export type Platform = 'ios' | 'android' | 'web' | 'node';

export type NodeConfigOptions = {
  /** Package root. Defaults to the directory of the config file. */
  root?: string;
  /** Project name shown in the reporter. */
  name?: string;
  /** Override for the test file globs. */
  include?: string[];
  /** Files to run before each test file. */
  setupFiles?: string[];
};

export type PlatformProjectOptions = {
  /** Package root. */
  root: string;
  /** Directory to scan for tests. Defaults to `<root>/src`. */
  dir?: string;
  /** Extra setup files, run after the preset's own. */
  setupFiles?: string[];
  /** Project name. Defaults to the platform. */
  name?: string;
};

export type UniversalConfigOptions = {
  /** Package root (use `import.meta.dirname`). */
  root: string;
  /** Platforms to create projects for. Defaults to all four. */
  platforms?: Platform[];
  /** Sub-target directories with their own Node-only tests, e.g. `['plugin']`. */
  subprojects?: string[];
  /** Extra setup files for the platform projects. */
  setupFiles?: string[];
};

export const NODE_TEST_INCLUDE: string[];
export const NODE_TEST_EXCLUDE: string[];
export const NODE_RESOLVE_CONDITIONS: string[];
export const ASSET_EXTENSIONS: string[];
export const ALL_PLATFORMS: Platform[];

export function getTurboWorkerOptions(): { maxWorkers?: number };
export function getBareExtensions(
  platforms: string[],
  languageOptions?: { isTS?: boolean; isModern?: boolean; isReact?: boolean }
): string[];
export function getViteExtensions(platforms: string[]): string[];
export function getPlatformExtensions(platform: Platform): string[];
export function getPlatformTestInclude(
  platformExtensions: string[],
  options?: { rsc?: boolean }
): string[];
export function getPlatformConditions(platform: Platform): string[];
export const resolveSnapshotPath: ResolveSnapshotPathHandler;

/** Create a Vitest config for a Node-only package (CLI tools, config plugins). */
export function defineNodeConfig(options?: NodeConfigOptions): ViteUserConfig;
/** Build the inline Vitest project for one platform of a universal module. */
export function getPlatformProject(
  platform: Platform,
  options: PlatformProjectOptions
): ViteUserConfig;
/** Create the root Vitest config for a universal Expo module (one project per platform). */
export function defineUniversalConfig(options: UniversalConfigOptions): ViteUserConfig;
