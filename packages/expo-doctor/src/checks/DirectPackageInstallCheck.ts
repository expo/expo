import { DoctorMultiCheck, DoctorMultiCheckItemBase } from './DoctorMultiCheck';
import { DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';

export type DirectPackageInstallCheckItem = { packageName: string } & DoctorMultiCheckItemBase;

const baseCheckItem = {
  getMessage: (packageName: string) =>
    `The package "${packageName}" should not be installed directly in your project. It is a dependency of other Expo packages, which will install it automatically as needed.`,
  sdkVersionRange: '*',
};

const expoFirebaseCheckItem = {
  getMessage: (packageName: string) =>
    `The package "${packageName}" has been removed as of SDK 48. You should use the Firebase JS SDK or React Native Firebase directly. ${learnMore(
      'https://expo.fyi/firebase-migration-guide'
    )}`,
  sdkVersionRange: '>=48.0.0',
};

const shouldBeInstalledGloballyItem = {
  getMessage: (packageName: string) =>
    `The package "${packageName}" should not be installed directly in your project. It may conflict with the globally-installed version.`,
  sdkVersionRange: '*',
};

export const directPackageInstallCheckItems: DirectPackageInstallCheckItem[] = [
  { packageName: 'expo-modules-autolinking', ...baseCheckItem },
  { packageName: 'expo-dev-launcher', ...baseCheckItem },
  { packageName: 'expo-dev-menu', ...baseCheckItem },
  { packageName: 'npm', ...shouldBeInstalledGloballyItem },
  { packageName: 'yarn', ...shouldBeInstalledGloballyItem },
  { packageName: 'pnpm', ...shouldBeInstalledGloballyItem },
  {
    packageName: '@types/react-native',
    getMessage: () =>
      `The package  "@types/react-native" should not be installed directly in your project, as types are included with the "react-native" package.`,
    sdkVersionRange: '>=48.0.0',
  },
  {
    packageName: 'expo-permissions',
    getMessage: () =>
      `The package  "expo-permissions" was deprecated in SDK 41 and should be removed from your project because it may no longer compile on the latest SDK. It was replaced by permissions methods directly on modules, eg: MediaLibrary.requestPermissionsAsync().`,
    sdkVersionRange: '>=50.0.0',
  },
  { packageName: 'expo-firebase-analytics', ...expoFirebaseCheckItem },
  { packageName: 'expo-firebase-recaptcha', ...expoFirebaseCheckItem },
  // unlikely to be installed directly, but just in case
  { packageName: 'expo-firebase-core', ...expoFirebaseCheckItem },
  {
    packageName: 'expo-app-loading',
    getMessage: (packageName: string) =>
      `The package "${packageName}" has been removed as of SDK 49. You should use expo-splash-screen instead. ${learnMore(
        'https://docs.expo.dev/versions/latest/sdk/splash-screen/'
      )}`,
    sdkVersionRange: '>=49.0.0',
  },
  {
    packageName: '@expo/prebuild-config',
    ...baseCheckItem,
    // This has been true for a while, but I can't predict if removing it will cause issues in past SDK versions
    sdkVersionRange: '>=53.0.0',
  },
  {
    packageName: 'expo-modules-core',
    getMessage: () =>
      `The package "expo-modules-core" should not be installed directly in your project. You should instead use the exported API from the expo package.`,
    sdkVersionRange: '*',
  },
  {
    packageName: '@expo/config-plugins',
    getMessage: () =>
      `The package "@expo/config-plugins" should not be installed directly in your project. You should instead use "expo/config-plugins" which is a sub-export of the expo package.\n` +
      `If you installed "@expo/config-plugins" to fulfill a peer dependency for a config plugin, the plugin's maintainer should switch to the "expo/config-plugins" import, and you can ignore this warning.`,
    // See: https://github.com/expo/expo/pull/18855
    sdkVersionRange: '>=48.0.0',
  },
  {
    packageName: '@expo/metro-config',
    getMessage: () =>
      `The package "@expo/metro-config" should not be installed directly in your project. You should instead use "expo/metro-config" which is a sub-export of the expo package.`,
    // See: https://github.com/expo/expo/pull/18855
    sdkVersionRange: '*',
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
    checkItems.forEach((checkItem) => {
      const packageName = checkItem.packageName;
      if (pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName]) {
        issues.push(checkItem.getMessage(packageName));
      }
    });

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice: issues.length ? ['Remove these packages from your package.json.'] : [],
    };
  }
}
