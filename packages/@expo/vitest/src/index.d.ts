import type { ViteUserConfig } from 'vitest/config';

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

export const NODE_TEST_INCLUDE: string[];
export const NODE_TEST_EXCLUDE: string[];
export const NODE_RESOLVE_CONDITIONS: string[];

export function getTurboWorkerOptions(): { maxWorkers?: number };

/** Create a Vitest config for a Node-only package (CLI tools, config plugins). */
export function defineNodeConfig(options?: NodeConfigOptions): ViteUserConfig;
