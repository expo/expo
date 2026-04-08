import type { PromptObject } from 'prompts';

import type { Platform } from './prompts';

/**
 * Possible command options.
 */
export type CommandOptions = {
  target: string;
  source?: string;
  withReadme: boolean;
  withChangelog: boolean;
  example: boolean;
  local: boolean;
  barrel: boolean;
  // Module configuration options (skip prompts when provided)
  name?: string;
  description?: string;
  package?: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  repo?: string;
  platform?: Platform[];
};

/**
 * Represents an object that is passed to `ejs` when rendering the template.
 */
export type SubstitutionData = {
  project: {
    slug: string;
    name: string;
    version: string;
    description: string;
    package: string;
    moduleName: string;
    viewName: string;
    platforms: Platform[];
  };
  author: string;
  license: string;
  repo: string;
  type: 'remote';
};

export type LocalSubstitutionData = {
  project: {
    slug: string;
    name: string;
    package: string;
    moduleName: string;
    viewName: string;
    platforms: Platform[];
  };
  type: 'local';
};

export type CustomPromptObject = PromptObject & {
  name: string;
  resolvedValue?: string | null;
};

export type Answers = Record<string, string>;
