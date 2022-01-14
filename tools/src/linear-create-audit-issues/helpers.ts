import chalk from 'chalk';
import ora from 'ora';
import { getDownloadStatsAsync, NpmDownloadStats } from '../Npm';

import { getListOfPackagesAsync, Package } from '../Packages';

const VALID_PACKAGES = [
  'expo-ads-admob',
  'expo-ads-facebook',
  'expo-analytics-amplitude',
  'expo-analytics-segment',
  'expo-app-auth',
  'expo-app-loading',
  'expo-apple-authentication',
  'expo-application',
  'expo-asset',
  'expo-auth-session',
  'expo-av',
  'expo-background-fetch',
  'expo-barcode-scanner',
  'expo-battery',
  'expo-blur',
  'expo-branch',
  'expo-brightness',
  'expo-calendar',
  'expo-camera',
  'expo-cellular',
  'expo-checkbox',
  'expo-clipboard',
  'expo-constants',
  'expo-contacts',
  'expo-crypto',
  'expo-device',
  'expo-document-picker',
  'expo-error-recovery',
  'expo-face-detector',
  'expo-facebook',
  'expo-file-system',
  'expo-firebase-analytics',
  'expo-firebase-core',
  'expo-firebase-recaptcha',
  'expo-font',
  'expo-gl',
  'expo-google-app-auth',
  'expo-google-sign-in',
  'expo-haptics',
  'expo-image-loader',
  'expo-image-manipulator',
  'expo-image-picker',
  'expo-in-app-purchases',
  'expo-intent-launcher',
  'expo-json-utils',
  'expo-keep-awake',
  'expo-linear-gradient',
  'expo-linking',
  'expo-local-authentication',
  'expo-localization',
  'expo-location',
  'expo-mail-composer',
  'expo-media-library',
  'expo-navigation-bar',
  'expo-network',
  'expo-notifications',
  'expo-permissions',
  'expo-print',
  'expo-processing',
  'expo-random',
  'expo-screen-capture',
  'expo-screen-orientation',
  'expo-secure-store',
  'expo-sensors',
  'expo-sharing',
  'expo-sms',
  'expo-speech',
  'expo-splash-screen',
  'expo-sqlite',
  'expo-status-bar',
  'expo-store-review',
  'expo-system-ui',
  'expo-task-manager',
  'expo-tracking-transparency',
  'expo-updates',
  'expo-video-thumbnails',
  'expo-web-browser',
];

const PACKAGES_TO_BE_DEPRECATED = [
  'expo-ads-admob',
  'expo-amplitude',
  'expo-ads-facebook',
  'expo-facebook',
  'expo-firebase-analytics',
  'expo-firebase-core',
  'expo-firebase-recaptcha',
  'expo-google-sign-in',
  'expo-google-app-auth',
  'expo-location',
  'expo-segment',
]

export function isSchedulesForDeprecation(packageName: string) {
  return PACKAGES_TO_BE_DEPRECATED.includes(packageName)
}

export async function readPackages(packageNames: string[]) {
  const allPackages = await getListOfPackagesAsync(false);
  const allPackagesObj = allPackages.reduce((acc, pkg) => {
    acc[pkg.packageName] = pkg;
    return acc;
  }, {});

  // Verify that provided package names are valid.
  for (const packageName of packageNames) {
    if (!allPackagesObj[packageName]) {
      throw new Error(`Package with provided name ${chalk.green(packageName)} does not exist.`);
    }
  }

  const filteredPackages = allPackages.filter((pkg) => {
    const isPrivate = pkg.packageJson.private;
    const isIncluded = packageNames.length === 0 || packageNames.includes(pkg.packageName);
    const isValid = VALID_PACKAGES.includes(pkg.packageName);
    return !isPrivate && isIncluded && isValid;
  });

  return filteredPackages;
}

function startSpinner(spinnerText: string) {
  const spinner = ora(spinnerText).start();
  const startTime = process.hrtime.bigint();

  return {
    stopAndPersist: (withError?: boolean) => {
      const endTime = process.hrtime.bigint();
      const elapsedTime = (endTime - startTime) / 1_000_000n;
      spinner.stopAndPersist({
        text: withError
          ? `❌ ${spinnerText}: ${chalk.italic.redBright(`${elapsedTime}ms`)}`
          : `✅ ${spinnerText}: ${chalk.italic.greenBright(`${elapsedTime}ms`)}`,
      });
    },
  };
}

export function withSpinner<Args extends any[], R>(
  spinnerText: string,
  fn: (...args: Args) => Promise<R>
): (...args: Args) => Promise<R> {
  return async (...args) => {
    const spinner = startSpinner(spinnerText);
    try {
      const result = await fn(...args);
      spinner.stopAndPersist();
      return result;
    } catch (e) {
      spinner.stopAndPersist(true);
      throw e;
    }
  };
}

/**
 * Fetches all Npm download stats for each package and store them in fs cache.
 */
export async function getNpmDownloadStats(packages: Package[]) {
  return Object.fromEntries(await Promise.all(packages.map(pkg => pkg.packageName).map( async packageName => {
    const stats = await getDownloadStatsAsync(packageName)
    return [packageName, stats] as const;
  }))) as { [packageName: string]: NpmDownloadStats }
}
