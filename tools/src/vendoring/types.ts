import { FileTransforms } from '../Transforms.types';

export type VendoringModuleConfig = {
  source: string;
  semverPrefix?: string;
  packageJsonPath?: string;

  // Specify root directory for copying files. This is useful for workspace that the module is in a subfolder.
  rootDir?: string;

  sourceType?: 'git' | 'npm';

  excludeFiles?: string | string[];
  transforms?: FileTransforms;

  // using this hook to do some customization after copying vendoring files
  postCopyFilesHookAsync?: (sourceDirectory: string, targetDirectory: string) => Promise<void>;
};

export type VendoringTargetModulesConfig = {
  [key: string]: VendoringModuleConfig;
};

export type VendoringTargetConfig = {
  name: string;
  modules: VendoringTargetModulesConfig;
};

export type VendoringConfig = {
  [key: string]: VendoringTargetConfig;
};
