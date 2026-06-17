type CheckPackageType = 'package' | 'plugin' | 'cli' | 'utils';

/**
 * Type representing options for the `check-packages` command.
 */
export type ActionOptions = {
  since: string;
  all: boolean;
  core: boolean;
  test: boolean;
  lint: boolean;
  fixLint: boolean;
  dependencyCheck: boolean;
  packageNames: string[];
  checkPackageType: CheckPackageType;
};
