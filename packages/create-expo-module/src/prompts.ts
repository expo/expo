import path from 'node:path';
import type { Answers, PromptObject } from 'prompts';
import validateNpmPackage from 'validate-npm-package-name';

import { findGitHubEmail, findMyName } from './utils/git';
import { findGitHubUserFromEmail, guessRepoUrl } from './utils/github';

function sanitizeNamespaceFromSlug(slug: string): string {
  // Remove non-alphanumeric characters and reserved prefixes, then lowercase
  let namespace = slug
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(expo|reactnative)/i, '')
    .toLowerCase();

  // Ensure it starts with a letter to satisfy iOS bundle identifier rules
  if (!/^[a-z]/.test(namespace)) {
    namespace = `m${namespace}`;
  }
  // Fallback if empty
  if (!namespace) {
    namespace = 'module';
  }
  return namespace;
}

// Java/Android package validation: lowercase letters and digits, segments separated by dots, each starting with a letter.
const ANDROID_PACKAGE_REGEX = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;

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

export async function getSubstitutionDataPrompts(
  slug: string,
  includeGhConfig = false
): Promise<PromptObject<string>[]> {
  const prompts: PromptObject<string>[] = [
    {
      type: 'text',
      name: 'name',
      message: 'What is the native module name?',
      initial: () => {
        return slug
          .replace(/^@/, '')
          .replace(/^./, (match) => match.toUpperCase())
          .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
      },
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
        const namespace = sanitizeNamespaceFromSlug(slug);
        return `expo.modules.${namespace}`;
      },
      validate: (input) => {
        if (!input) return 'The Android package name cannot be empty';
        return ANDROID_PACKAGE_REGEX.test(input)
          ? true
          : 'Must be like com.example.name (lowercase, dot-separated, each segment starts with a letter)';
      },
    },
  ];

  if (includeGhConfig) {
    prompts.push(
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
      }
    );
  }

  return prompts;
}

export async function getLocalSubstitutionDataPrompts(
  slug: string
): Promise<PromptObject<string>[]> {
  return [
    {
      type: 'text',
      name: 'name',
      message: 'What is the native module name?',
      initial: () => {
        return slug
          .replace(/^@/, '')
          .replace(/^./, (match) => match.toUpperCase())
          .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
      },
      validate: (input) => !!input || 'The native module name cannot be empty',
    },
    {
      type: 'text',
      name: 'package',
      message: 'What is the Android package name?',
      initial: () => {
        const namespace = sanitizeNamespaceFromSlug(slug);
        return `expo.modules.${namespace}`;
      },
      validate: (input) => {
        if (!input) return 'The Android package name cannot be empty';
        return ANDROID_PACKAGE_REGEX.test(input)
          ? true
          : 'Must be like com.example.name (lowercase, dot-separated, each segment starts with a letter)';
      },
    },
  ];
}
