import type { HelpMessageParams, HelpMessageSectionParams } from './types';
export declare const helpMessage: ({ commands, options, promptCommand, promptOptions, }: HelpMessageParams) => string;
export declare const helpMessageSection: <T>({ items, left, right, title, }: HelpMessageSectionParams<T>) => string;
