import chalk from 'chalk';
import prompts from 'prompts';

import { env } from './utils/env';

export const LEGACY_TEMPLATES = [
  {
    title: 'Blank',
    value: 'expo-template-blank',
    description: 'a minimal app as clean as an empty canvas',
  },

  {
    title: 'Blank (TypeScript)',
    value: 'expo-template-blank-typescript',
    description: 'blank app with TypeScript enabled',
  },
  {
    title: 'Navigation (TypeScript)',
    value: 'expo-template-tabs',
    description: 'File-based routing with TypeScript enabled',
  },

  {
    title: 'Blank (Bare)',
    value: 'expo-template-bare-minimum',
    description: 'blank app with the native code exposed (expo prebuild)',
  },
];

export const ALIASES = LEGACY_TEMPLATES.map(({ value }) => value);

export async function promptTemplateAsync() {
  if (env.CI) {
    throw new Error('Cannot prompt for template in CI');
  }
  const { answer } = await prompts({
    type: 'select',
    name: 'answer',
    message: 'Choose a template:',
    choices: LEGACY_TEMPLATES,
  });

  if (!answer) {
    console.log();
    console.log(chalk`Please specify the template, example: {cyan --template expo-template-blank}`);
    console.log();
    process.exit(1);
  }

  return answer;
}
