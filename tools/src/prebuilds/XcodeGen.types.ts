// More detailed spec schema available here:
// https://github.com/yonaskolb/XcodeGen/blob/master/Docs/ProjectSpec.md
export type ProjectSpec = {
  name: string;
  projectReferences?: {
    [key: string]: {
      path: string;
    };
  };
  targets?: {
    [targetName: string]: {
      type: string;
      platform: ProjectSpecPlatform[];
      sources?: ProjectSpecSource[];
      dependencies?: ProjectSpecDependency[];
      settings?: ProjectSpecSettings;
      info?: {
        path: string;
        properties: Record<string, string>;
      };
    };
  };
  options?: ProjectSpecOptions;
  settings?: ProjectSpecSettings;
};

export type ProjectSpecPlatform = 'iOS' | 'macOS' | 'tvOS' | 'watchOS';

export type ProjectSpecSource = {
  path: string;
  name?: string;
  createIntermediateGroups?: boolean;
  includes?: string[];
  excludes?: string[];
  compilerFlags?: string;
};

export type ProjectSpecDependency = {
  // framework type
  framework?: string;
  implicit?: boolean;

  // target/project type
  target?: string;

  // SDK framework
  sdk?: string;

  // shared options
  embed?: boolean;
  link?: boolean;
  codeSign?: boolean;
  removeHeaders?: boolean;
  weak?: boolean;
};

export type ProjectSpecOptions = {
  minimumXcodeGenVersion: string;
  deploymentTarget: Record<ProjectSpecPlatform, string>;
};

export type ProjectSpecSettings = {
  base: XcodeConfig;
};

export type XcodeConfig = Record<string, string>;
