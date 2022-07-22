import path from 'path';
import { Answers, PromptObject } from 'prompts';
import validateNpmPackage from 'validate-npm-package-name';

import { findGitHubEmail, findGitHubProfileUrl, findMyName, guessRepoUrl } from './utils';

export default async function getPrompts(targetDir: string): Promise<PromptObject<string>[]> {
  const targetBasename = path.basename(targetDir);

  return [
    {
      type: 'text',
      name: 'slug',
      message: 'What is the name of the npm package?',
      initial: validateNpmPackage(targetBasename).validForNewPackages ? targetBasename : undefined,
      validate: (input) =>
        validateNpmPackage(input).validForNewPackages || 'Must be a valid npm package name',
    },
    {
      type: 'text',
      name: 'name',
      message: 'What is the native module name?',
      initial: (_, answers: Answers<string>) => {
        return answers.slug
          .replace(/^@/, '')
          .replace(/^./, (match) => match.toUpperCase())
          .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
      },
    },
    {
      type: 'text',
      name: 'description',
      message: 'How would you describe the module?',
      initial: 'My new module',
      validate: (input) => !!input || 'Cannot be empty',
    },
    {
      type: 'text',
      name: 'package',
      message: 'What is the Android package name?',
      initial: (_, answers: Answers<string>) => {
        const namespace = answers.slug
          .replace(/\W/g, '')
          .replace(/^(expo|reactnative)/, '')
          .toLowerCase();
        return `expo.modules.${namespace}`;
      },
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
        await findGitHubProfileUrl(answers.authorEmail),
    },
    {
      type: 'text',
      name: 'repo',
      message: 'What is the URL for the repository?',
      initial: async (_, answers: Answers<string>) =>
        await guessRepoUrl(answers.authorUrl, answers.slug),
      validate: (input) => /^https?:\/\//.test(input) || 'Must be a valid URL',
    },
  ];
}
