import path from 'node:path';
import type { Answers, PromptObject } from 'prompts';
import validateNpmPackage from 'validate-npm-package-name';

import { ensureSafeModuleName } from './appleFrameworks';
import { ALL_FEATURES } from './features';
import { PACKAGE_MANAGERS, type PackageManagerName } from './packageManager';
import { findGitHubEmail, findMyName } from './utils/git';
import { findGitHubUserFromEmail, guessRepoUrl } from './utils/github';

export const ALL_PLATFORMS = ['apple', 'android', 'web'] as const;
export type Platform = (typeof ALL_PLATFORMS)[number];

export function getPlatformPrompt(preSelected: readonly string[] = ALL_PLATFORMS): PromptObject {
  return {
    type: 'multiselect',
    name: 'platforms',
    message: 'Which platforms should this module support?',
    choices: ALL_PLATFORMS.map((p) => ({
      title: p,
      value: p,
      selected: preSelected.includes(p),
    })),
    min: 1,
    hint: '- Space to select. Enter to confirm.',
  };
}

/**
 * Converts a slug to a native module name (PascalCase), ensuring it doesn't conflict with Apple frameworks.
 */
function slugToSafeModuleName(slug: string): string {
  const rawName = slug
    .replace(/^@/, '')
    .replace(/^./, (match) => match.toUpperCase())
    .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
  return ensureSafeModuleName(rawName).name;
}

function getInitialName(customTargetPath?: string | null): string {
  const targetBasename = customTargetPath && path.basename(customTargetPath);
  return targetBasename && validateNpmPackage(targetBasename).validForNewPackages
    ? targetBasename
    : 'my-module';
}

export function getSlugPrompt(customTargetPath?: string | null): PromptObject<string> {
  const initial = getInitialName(customTargetPath);
  return {
    type: 'text',
    name: 'slug',
    message: 'What is the name of the npm package?',
    initial,
    validate: (input) =>
      validateNpmPackage(input).validForNewPackages || 'Must be a valid npm package name',
  };
}

export function getLocalFolderNamePrompt(customTargetPath?: string | null): PromptObject<string> {
  const initial = getInitialName(customTargetPath);

  return {
    type: 'text',
    name: 'slug',
    message: 'What is the name of the local module?',
    initial,
    validate: (input) =>
      validateNpmPackage(input).validForNewPackages || 'Must be a valid npm package name',
  };
}

export async function getSubstitutionDataPrompts(slug: string): Promise<PromptObject<string>[]> {
  return [
    {
      type: 'text',
      name: 'name',
      message: 'What is the native module name?',
      initial: () => slugToSafeModuleName(slug),
      validate: (input) => !!input || 'The native module name cannot be empty',
    },
    {
      type: 'text',
      name: 'description',
      message: 'How would you describe the module?',
      initial: 'My new module',
      validate: (input) => !!input || 'The description cannot be empty',
    },
    {
      type: 'text',
      name: 'package',
      message: 'What is the Android package name?',
      initial: () => {
        const namespace = slug
          .replace(/\W/g, '')
          .replace(/^(expo|reactnative)/, '')
          .toLowerCase();
        return `expo.modules.${namespace}`;
      },
      validate: (input) => !!input || 'The Android package name cannot be empty',
    },
    {
      type: 'text',
      name: 'authorName',
      message: 'What is the name of the package author?',
      initial: await findMyName(),
      validate: (input) => !!input || 'Cannot be empty',
    },
    {
      type: 'text',
      name: 'authorEmail',
      message: 'What is the email address of the author?',
      initial: await findGitHubEmail(),
    },
    {
      type: 'text',
      name: 'authorUrl',
      message: "What is the URL to the author's GitHub profile?",
      initial: async (_, answers: Answers<string>) =>
        await findGitHubUserFromEmail(answers.authorEmail).then((actor) => actor || ''),
    },
    {
      type: 'text',
      name: 'repo',
      message: 'What is the URL for the repository?',
      initial: async (_, answers: Answers<string>) => await guessRepoUrl(answers.authorUrl, slug),
      validate: (input) => /^https?:\/\//.test(input) || 'Must be a valid URL',
    },
    {
      type: 'text',
      name: 'license',
      message: 'What license does the module use?',
      initial: 'MIT',
      validate: (input) => !!input || 'The license cannot be empty',
    },
    {
      type: 'text',
      name: 'version',
      message: 'What is the initial version of the module?',
      initial: '0.1.0',
      validate: (input) => !!input || 'The version cannot be empty',
    },
  ];
}

export function getFeaturesPrompt(): PromptObject {
  return {
    type: 'multiselect',
    name: 'features',
    message: 'Which feature examples should this module include?',
    choices: ALL_FEATURES.map((f) => ({
      title: f,
      value: f,
      selected: false,
    })),
    hint: '- Space to select. Enter to confirm (empty = minimal module).',
  };
}

export function getPackageManagerPrompt(defaultPackageManager: PackageManagerName): PromptObject {
  return {
    type: 'select',
    name: 'packageManager',
    message: 'Which package manager would you like to use?',
    choices: PACKAGE_MANAGERS.map((packageManager) => ({
      title: packageManager,
      value: packageManager,
    })),
    initial: PACKAGE_MANAGERS.indexOf(defaultPackageManager),
  };
}

export async function getLocalSubstitutionDataPrompts(
  slug: string
): Promise<PromptObject<string>[]> {
  return [
    {
      type: 'text',
      name: 'name',
      message: 'What is the native module name?',
      initial: () => slugToSafeModuleName(slug),
      validate: (input) => !!input || 'The native module name cannot be empty',
    },
    {
      type: 'text',
      name: 'package',
      message: 'What is the Android package name?',
      initial: () => {
        const namespace = slug
          .replace(/\W/g, '')
          .replace(/^(expo|reactnative)/, '')
          .toLowerCase();
        return `expo.modules.${namespace}`;
      },
      validate: (input) => !!input || 'The Android package name cannot be empty',
    },
  ];
}
