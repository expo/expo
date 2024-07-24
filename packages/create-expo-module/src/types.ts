import { PromptObject } from 'prompts';

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
  };
  type: 'local';
};

export type CustomPromptObject = PromptObject & {
  name: string;
  resolvedValue?: string | null;
};

export type Answers = Record<string, string>;
