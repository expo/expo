import { Podspec } from '../CocoaPods';
import { FileTransforms } from '../Transforms.types';

export type VendoringModulePlatformConfig<T = object> = T & {
  transforms?: FileTransforms;
};

export type VendoringModuleConfig = {
  source: string;
  semverPrefix?: string;
  packageJsonPath?: string;
  ios?: VendoringModulePlatformConfig<{
    // this hook can do some transformation before running `pod ipc spec ...`.
    // use this hook as a workaround for some podspecs showing errors and violating json format.
    preReadPodspecHookAsync?: (podspecPath: string) => Promise<string>;

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

export type VendoringProvider<T = object> = {
  vendorAsync: (
    sourceDirectory: string,
    targetDirectory: string,
    platformConfig?: VendoringModulePlatformConfig<T>
  ) => Promise<void>;
};
