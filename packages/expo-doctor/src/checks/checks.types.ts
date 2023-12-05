import { ExpoConfig, PackageJSONConfig } from '@expo/config';

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
  exp: ExpoConfig;
  pkg: PackageJSONConfig;
}
