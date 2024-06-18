import path from 'path';
import { Answers, PromptObject } from 'prompts';
import validateNpmPackage from 'validate-npm-package-name';

import { findGitHubEmail, findMyName } from './utils/git';
import { findGitHubUserFromEmail, guessRepoUrl } from './utils/github';

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
  ];
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
