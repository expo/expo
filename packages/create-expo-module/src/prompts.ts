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
      type: 'multiselect',
      name: 'platform',
      message: 'Which platform do you want to generate?',
      choices: [
        { title: 'iOS', value: 'ios' },
        { title: 'Android', value: 'android' },
        { title: 'Web', value: 'web' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'includeView',
      message: 'Do you want the module to include a native View component?',
      initial: true,
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

export function getViewNamePrompt(name: string): PromptObject<string> {
  return {
    type: 'text',
    name: 'viewName',
    message: 'What is the native View name?',
    initial: () => {
      const base = name || '';
      let suggestion = base.endsWith('View') ? base : `${base}View`;
      const moduleName = base.endsWith('Module') ? base : `${base}Module`;
      if (suggestion === moduleName) {
        suggestion = `${base}NativeView`;
      }
      return suggestion;
    },
    validate: (input: string) => {
      if (!input) return 'The native View name cannot be empty';
      const base = name || '';
      const prospectiveModuleName = base.endsWith('Module') ? base : `${base}Module`;
      if (input === prospectiveModuleName) {
        return 'View name must differ from the module name (try removing "Module" or adding "View").';
      }
      return true;
    },
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
      initial: () => {
        return slug
          .replace(/^@/, '')
          .replace(/^./, (match) => match.toUpperCase())
          .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
      },
      validate: (input) => !!input || 'The native module name cannot be empty',
    },
    {
      type: 'select',
      name: 'platform',
      message: 'Which platform do you want to generate?',
      choices: [
        { title: 'iOS', value: 'ios' },
        { title: 'Android', value: 'android' },
        { title: 'Web', value: 'web' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'includeView',
      message: 'Do you want the module to include a native View component?',
      initial: true,
    },
  ];
}
