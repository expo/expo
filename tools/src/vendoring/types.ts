import { Podspec } from '../CocoaPods';
import { CopyFilesTransforms } from '../utils/copyFilesWithTransforms';

export type VendoringTransforms = CopyFilesTransforms;

export type VendoringModulePlatformConfig<T = {}> = T & {
  transforms?: VendoringTransforms;
};

export type VendoringModuleConfig = {
  source: string;
  semverPrefix?: string;
  ios?: VendoringModulePlatformConfig<{
    mutatePodspec?: (podspec: Podspec) => void;
  }>;
  android?: VendoringModulePlatformConfig<{
    includeFiles?: string | string[];
    excludeFiles?: string | string[];
  }>;
};

export type VendoringTargetModulesConfig = {
  [key: string]: VendoringModuleConfig;
};

export type VendoringTargetPlatformConfig = {
  targetDirectory: string;
};

export type VendoringTargetConfig = {
  name: string;
  platforms: {
    ios?: VendoringTargetPlatformConfig;
    android?: VendoringTargetPlatformConfig;
  };
  modules: VendoringTargetModulesConfig;
};

export type VendoringConfig = {
  [key: string]: VendoringTargetConfig;
};

export type VendoringProvider<T = {}> = {
  vendorAsync: (
    sourceDirectory: string,
    targetDirectory: string,
    platformConfig?: VendoringModulePlatformConfig<T>
  ) => Promise<void>;
};
