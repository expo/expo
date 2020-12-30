import { VendoringConfig } from '../types';

// type VendoredModuleUpdateStep = {
//   iosPrefix?: string;
//   sourceIosPath?: string;
//   targetIosPath?: string;
//   sourceAndroidPath?: string;
//   targetAndroidPath?: string;
//   sourceAndroidPackage?: string;
//   targetAndroidPackage?: string;
//   recursive?: boolean;
//   updatePbxproj?: boolean;
// };

// type ModuleModifier = (
//   moduleConfig: VendoredModuleConfig,
//   clonedProjectPath: string
// ) => Promise<void>;

// type VendoredModuleConfig = {
//   repoUrl: string;
//   packageName?: string;
//   packageJsonPath?: string;
//   installableInManagedApps?: boolean;
//   semverPrefix?: '~' | '^';
//   skipCleanup?: boolean;
//   steps: VendoredModuleUpdateStep[];
//   moduleModifier?: ModuleModifier;
//   warnings?: string[];
// };

const config: VendoringConfig = {
  'expo-go': require('./expoGoConfig').default,
};

export default config;
