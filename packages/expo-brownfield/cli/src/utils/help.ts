import chalk from 'chalk';

import type { HelpMessageParams, HelpMessageSectionParams } from './types';
import { Output } from '../constants/output';

export const helpMessage = ({
  commands,
  options,
  promptCommand = '<command>',
  promptOptions = '<options>',
}: HelpMessageParams): string => {
  const optionsSection = helpMessageSection({
    items: options,
    left: ({ option, short }) => `${option}${short ? `, ${short}` : ''}`,
    right: ({ description }) => description,
    title: 'Options:',
  });

  const commandsSection = helpMessageSection({
    items: commands,
    left: ({ command, hasOptions }) => `${command}${hasOptions ? ` [${promptOptions}]` : ''}`,
    right: ({ description }) => description,
    title: 'Commands:',
  });

  const usageSection = `${chalk.bold('Usage:')} expo-brownfield ${promptCommand}  [${promptOptions}]`;

  return `\n${usageSection}${optionsSection}${commandsSection}\n`;
};

export const helpMessageSection = <T>({
  items,
  left,
  right,
  title,
}: HelpMessageSectionParams<T>): string => {
  if (!items) {
    return '';
  }

  const content = items.reduce<string>((acc, item) => {
    const ls = left(item);
    const rs = right(item);
    const spacing = ' '.repeat(Output.HelpSpacing - ls.length);
    return `${acc}\n  ${ls}${spacing}${rs}`;
  }, '');

  return `\n\n${chalk.bold(title)}${content}`;
};
