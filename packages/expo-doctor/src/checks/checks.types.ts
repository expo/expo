import { ExpoConfig, PackageJSONConfig } from '@expo/config';

import { AppConfigFieldsNotSyncedToNativeProjectsCheck } from './AppConfigFieldsNotSyncedToNativeProjectsCheck';
import { DirectPackageInstallCheck } from './DirectPackageInstallCheck';
import { ExpoConfigCommonIssueCheck } from './ExpoConfigCommonIssueCheck';
import { ExpoConfigSchemaCheck } from './ExpoConfigSchemaCheck';
import { GlobalPackageInstalledLocallyCheck } from './GlobalPackageInstalledLocallyCheck';
import { IllegalPackageCheck } from './IllegalPackageCheck';
import { MetroConfigCheck } from './MetroConfigCheck';
import { NativeToolingVersionCheck } from './NativeToolingVersionCheck';
import { PackageJsonCheck } from './PackageJsonCheck';
import { PackageManagerVersionCheck } from './PackageManagerVersionCheck';
import { ProjectSetupCheck } from './ProjectSetupCheck';
import { StoreCompatibilityCheck } from './StoreCompatibilityCheck';
import { SupportPackageVersionCheck } from './SupportPackageVersionCheck';

export interface DoctorCheck {
  // description that will appear as each check is run
  description: string;
  // semver range of SDK versions that this check is relevant for
  sdkVersionRange: string;
  runAsync: (params: DoctorCheckParams) => Promise<DoctorCheckResult>;
}

export interface DoctorCheckResult {
  isSuccessful: boolean;
  /** many checks currently output their own issues, no need to duplicate */
  issues: string[];
  // Optional: a string with a suggestion to resolve the issue, which will be appended to the issue
  advice?: string;
}

export interface DoctorCheckParams {
  projectRoot: string;

  // from ProjectConfig in @expo/config
  exp: ExpoConfig;
  pkg: PackageJSONConfig;
  hasUnusedStaticConfig: boolean;
  staticConfigPath: string | null;
  dynamicConfigPath: string | null;
}

// Add additional checks here
export const DOCTOR_CHECKS: DoctorCheck[] = [
  // Project Structure Checks
  new ProjectSetupCheck(),
  new PackageJsonCheck(),
  new ExpoConfigSchemaCheck(),
  new ExpoConfigCommonIssueCheck(),
  new MetroConfigCheck(),

  // Package Management Checks
  new PackageManagerVersionCheck(),
  new IllegalPackageCheck(),
  new GlobalPackageInstalledLocallyCheck(),
  new DirectPackageInstallCheck(),

  // Version Checks
  new SupportPackageVersionCheck(),
  new NativeToolingVersionCheck(),

  // Compatibility Checks
  new StoreCompatibilityCheck(),
  new AppConfigFieldsNotSyncedToNativeProjectsCheck(),
];

export type DoctorConfigChecks = {
  [checkName: string]: {
    enabled: boolean;
  };
};
