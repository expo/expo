import type { PromptObject } from 'prompts';

import type { Feature } from './features';
import type { ModulesApi } from './modulesApi';
import type { PackageManagerName } from './packageManager';
import type { NativePlatform, Platform } from './prompts';

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
  modulesApi?: ModulesApi;
  ignoreCompatibilityCheck?: boolean;
};

/**
 * Names of the native classes and JavaScript exports that the template generates.
 */
export type GeneratedNames = {
  moduleName: string;
  viewName: string;
  swiftUIViewName: string;
  swiftUIModifierName: string;
  composeViewName: string;
  composeModifierName: string;
  sharedObjectName: string;
};

/**
 * The module that defines the views of an Expo Modules API 2.0 module with the Module DSL.
 */
export type ViewsModule = {
  /** The JavaScript name. */
  name: string;
  /** The native class name. */
  moduleName: string;
  /** The native platforms whose view features the module defines. */
  platforms: NativePlatform[];
};

export type ProjectData = GeneratedNames & {
  slug: string;
  name: string;
  package: string;
  platforms: Platform[];
  features: Feature[];
};

/**
 * Project data of the rendered template, with the values that depend on the Expo Modules API
 * version.
 */
export type TemplateProjectData = ProjectData & {
  modulesApi: ModulesApi;
  viewsModule: ViewsModule | null;
};

/**
 * Represents an object that is passed to `ejs` when rendering the template.
 */
export type SubstitutionData = {
  project: ProjectData & {
    version: string;
    description: string;
  };
  author: string;
  license: string;
  repo: string;
  type: 'standalone';
};

export type LocalSubstitutionData = {
  project: ProjectData;
  type: 'local';
};

export type CustomPromptObject = PromptObject & {
  name: string;
  resolvedValue?: string | null;
};

export type Answers = Record<string, string>;
