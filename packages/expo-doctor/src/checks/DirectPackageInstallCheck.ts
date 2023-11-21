import { DoctorMultiCheck, DoctorMultiCheckItemBase } from './DoctorMultiCheck';
import { DoctorCheckParams, DoctorCheckResult } from './checks.types';

export type DirectPackageInstallCheckItem = {
  packageName: string;
} & DoctorMultiCheckItemBase;

const baseCheckItem = {
  getMessage: (packageName: string) =>
    `The package "${packageName}" should not be installed directly in your project. It is a dependency of other Expo packages, which will install it automatically as needed.`,
  sdkVersionRange: '*',
};

const shouldBeInstalledGloballyItem = {
  getMessage: (packageName: string) =>
    `The package "${packageName}" should not be installed directly in your project. It may conflict with the globally-installed version.`,
  sdkVersionRange: '*',
};

export const directPackageInstallCheckItems: DirectPackageInstallCheckItem[] = [
  {
    packageName: 'expo-modules-core',
    ...baseCheckItem,
  },
  {
    packageName: 'expo-modules-autolinking',
    ...baseCheckItem,
  },
  {
    packageName: 'expo-dev-launcher',
    ...baseCheckItem,
  },
  {
    packageName: 'expo-dev-menu',
    ...baseCheckItem,
  },
  {
    packageName: 'npm',
    ...shouldBeInstalledGloballyItem,
  },
  {
    packageName: 'yarn',
    ...shouldBeInstalledGloballyItem,
  },
  {
    packageName: 'pnpm',
    ...shouldBeInstalledGloballyItem,
  },
  {
    packageName: '@types/react-native',
    getMessage: () =>
      `The package  "@types/react-native" should not be installed directly in your project, as types are included with the "react-native" package.`,
    sdkVersionRange: '>=48.0.0',
  },
];

export class DirectPackageInstallCheck extends DoctorMultiCheck<DirectPackageInstallCheckItem> {
  description = 'Check dependencies for packages that should not be installed directly';

  sdkVersionRange = '*';

  checkItems = directPackageInstallCheckItems;

  protected async runAsyncInner(
    { pkg }: DoctorCheckParams,
    checkItems: DirectPackageInstallCheckItem[]
  ): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    // ** check for dependencies that should only be transitive **
    checkItems.forEach(checkItem => {
      const packageName = checkItem.packageName;
      if (pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName]) {
        issues.push(checkItem.getMessage(packageName));
      }
    });

    return {
      isSuccessful: issues.length === 0,
      issues,
    };
  }
}
