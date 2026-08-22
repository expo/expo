// @ref llp/0004-smart-start-and-project-state.rfc.md §Sub-features
// "What must rerun after installing this package?" — the same classification the decision table
// uses, consumed right after `expo install`.
import { readStaticAppConfigAsync } from './appConfig';
import {
  describeNativeCode,
  hasNativeCode,
  inspectPackageAsync,
  readProjectNativeDirsAsync,
} from './nativeCode';
import {
  listDependencyNames,
  loadBundledNativeModulesAsync,
  parsePackageName,
  readProjectPackageJsonAsync,
  resolvePackageRootAsync,
} from './nodeModules';
import type { InstallImpact, InstallImpactReport } from './types';

/**
 * Classify what each installed package changed, and what must rerun because of it.
 *
 * Pure inspection of `node_modules` and the project config; nothing is spawned, so this is safe
 * to run right after an install. Unknown packages are reported as JavaScript-only, the cheapest
 * action, rather than making the caller guess.
 *
 * @param packageNames package specs as passed to `expo install`, version ranges included.
 */
export async function classifyInstallImpactAsync(
  projectRoot: string,
  packageNames: string[]
): Promise<InstallImpactReport[]> {
  if (!packageNames.length) {
    return [];
  }

  const [bundledNativeModules, appConfig, nativeDirs, packageJson] = await Promise.all([
    loadBundledNativeModulesAsync(projectRoot),
    readStaticAppConfigAsync(projectRoot),
    readProjectNativeDirsAsync(projectRoot),
    readProjectPackageJsonAsync(projectRoot),
  ]);

  const isBare = nativeDirs.ios || nativeDirs.android;
  // `expo-dev-client` as a dependency means the project builds its own runtime, so a new native
  // module needs a new build even when Expo Go would have it.
  const usesDevClient = listDependencyNames(packageJson).includes('expo-dev-client');
  const targetsExpoGo = !isBare && !usesDevClient;

  const reports: InstallImpactReport[] = [];
  for (const spec of packageNames) {
    const packageName = parsePackageName(spec);
    const reasons: string[] = [];
    let isNativeModule = false;
    let isConfigPlugin = false;

    const packageRoot = await resolvePackageRootAsync(projectRoot, packageName);
    if (!packageRoot) {
      reasons.push(
        `not found in node_modules, so it is reported as JavaScript only; rerun the classification once it is installed`
      );
    } else {
      const signals = await inspectPackageAsync(packageRoot);
      isNativeModule = hasNativeCode(signals);
      reasons.push(...describeNativeCode(signals));

      if (signals.appPlugin) {
        isConfigPlugin = true;
        reasons.push('ships an app.plugin.js config plugin');
      }
      if (appConfig.plugins.some((plugin) => plugin.packageName === packageName)) {
        isConfigPlugin = true;
        reasons.push(`is listed in the ${appConfig.source} plugins`);
      }
      if (!isNativeModule && !isConfigPlugin) {
        reasons.push('ships no native code and no config plugin');
      }
    }

    // A package can be both; the native module decides the impact, because it is the stronger
    // requirement. Both findings stay in `reasons`.
    const impact: InstallImpact = isNativeModule
      ? 'native-module'
      : isConfigPlugin
        ? 'config-plugin'
        : 'js-only';
    const expoGoBundled = !!bundledNativeModules?.[packageName];

    reports.push({
      packageName,
      impact,
      expoGoBundled,
      action: resolveAction({ impact, expoGoBundled, targetsExpoGo, isBare }),
      reasons,
    });
  }

  return reports;
}

function resolveAction({
  impact,
  expoGoBundled,
  targetsExpoGo,
  isBare,
}: {
  impact: InstallImpact;
  expoGoBundled: boolean;
  targetsExpoGo: boolean;
  isBare: boolean;
}): InstallImpactReport['action'] {
  if (impact === 'js-only') {
    // The dev server serves the new code after a reload; the native runtime is unchanged.
    return 'reload';
  }
  if (expoGoBundled && targetsExpoGo) {
    // The native module is already inside the Expo Go runtime the project runs on.
    return 'reload';
  }
  // Bare projects own their native directories, so CNG must not regenerate them.
  return isBare ? 'native-sync' : 'prebuild-and-build';
}
