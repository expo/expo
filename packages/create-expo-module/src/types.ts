import type { PromptObject } from 'prompts';

import type { Feature } from './features';
import type { PackageManagerName } from './packageManager';
import type { Platform } from './prompts';

export type { Feature };

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
  name?: string;
  description?: string;
  package?: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  repo?: string;
  license?: string;
  moduleVersion?: string;
  platform?: Platform[];
  features?: Feature[];
  fullExample?: boolean;
  packageManager?: PackageManagerName;
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
    sharedObjectName: string;
    platforms: Platform[];
    features: Feature[];
  };
  author: string;
  license: string;
  repo: string;
  type: 'standalone';
};

export type LocalSubstitutionData = {
  project: {
    slug: string;
    name: string;
    package: string;
    moduleName: string;
    viewName: string;
    sharedObjectName: string;
    platforms: Platform[];
    features: Feature[];
  };
  type: 'local';
};

export type CustomPromptObject = PromptObject & {
  name: string;
  resolvedValue?: string | null;
};

export type Answers = Record<string, string>;
