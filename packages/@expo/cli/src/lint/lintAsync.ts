import { createForProject } from '@expo/package-manager';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';

import { ESLintProjectPrerequisite } from './ESlintPrerequisite';
import type { Options } from './resolveOptions';
import { CommandError } from '../utils/errors';
import { findUpProjectRootOrAssert } from '../utils/findUp';
import { setNodeEnv } from '../utils/nodeEnv';

const debug = require('debug')('expo:lint');

const DEFAULT_INPUTS = ['src', 'app', 'components'];

export const lintAsync = async (
  inputs: string[],
  options: Options & { projectRoot?: string },
  eslintArguments: string[] = []
) => {
  setNodeEnv('development');
  // Locate the project root based on the process current working directory.
  // This enables users to run `npx expo install` from a subdirectory of the project.
  const projectRoot = options?.projectRoot ?? findUpProjectRootOrAssert(process.cwd());
  require('@expo/env').load(projectRoot);

  // TODO: Perhaps we should assert that TypeScript is required.

  const prerequisite = new ESLintProjectPrerequisite(projectRoot);
  if (!(await prerequisite.assertAsync())) {
    await prerequisite.bootstrapAsync();
  }

  // TODO(@kitten): The direct require is fine, since we assume `expo > @expo/cli` does not depend on eslint
  // However, it'd be safer to replace this with resolve-from, or another way of requiring via the project root
  const { loadESLint } = require('eslint');

  const mod = await import('eslint');

  let ESLint: typeof import('eslint').ESLint;
  // loadESLint is >= 8.57.0 (https://github.com/eslint/eslint/releases/tag/v8.57.0) https://github.com/eslint/eslint/pull/18098
  if ('loadESLint' in mod) {
    ESLint = await loadESLint({ cwd: options.projectRoot });
  } else {
    throw new CommandError(
      'npx expo lint requires ESLint version 8.57.0 or greater. Upgrade eslint or use npx eslint directly.'
    );
  }

  const version = ESLint?.version;

  if (!version || semver.lt(version, '8.57.0')) {
    throw new CommandError(
      'npx expo lint requires ESLint version 8.57.0 or greater. Upgrade eslint or use npx eslint directly.'
    );
  }

  if (!inputs.length) {
    DEFAULT_INPUTS.map((input) => {
      const abs = path.join(projectRoot, input);
      if (fs.existsSync(abs)) {
        inputs.push(abs);
      }
    });
  }

  const eslintArgs: string[] = [];
  inputs.forEach((input) => {
    eslintArgs.push(input);
  });
  options.ext.forEach((ext) => {
    eslintArgs.push('--ext', ext);
  });

  eslintArgs.push(`--fix=${options.fix}`);
  eslintArgs.push(`--cache=${options.cache}`);

  if (options.config) {
    eslintArgs.push(`--config`, options.config);
  }
  if (!options.ignore) {
    eslintArgs.push('--no-ignore');
  }
  options.ignorePattern.forEach((pattern) => {
    eslintArgs.push(`--ignore-pattern=${pattern}`);
  });

  eslintArgs.push(...options.fixType.map((type) => `--fix-type=${type}`));

  if (options.quiet) {
    eslintArgs.push('--quiet');
  }

  if (options.maxWarnings != null && options.maxWarnings >= 0) {
    eslintArgs.push(`--max-warnings=${options.maxWarnings.toString()}`);
  }

  const cacheDir = path.join(projectRoot, '.expo', 'cache', 'eslint/');
  // Add other defaults
  eslintArgs.push(`--cache-location=${cacheDir}`);

  // Add passthrough arguments
  eslintArguments.forEach((arg) => {
    eslintArgs.push(arg);
  });

  debug('Running ESLint with args: %O', eslintArgs);

  const manager = createForProject(projectRoot, { silent: true });

  try {
    // TODO: Custom logger
    // - Use relative paths
    // - When react-hooks/exhaustive-deps is hit, notify about enabling React Compiler.
    // - Green check when no issues are found.
    await manager.runBinAsync(['eslint', ...eslintArgs], {
      stdio: 'inherit',
    });
  } catch (error: any) {
    process.exit(error.status);
  }
};
