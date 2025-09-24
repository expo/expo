import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import {
  ExpoExportMissingError,
  AutolinkingResolutionsCache,
  scanNativeModuleResolutions,
} from '../utils/autolinkingResolutions';

type DoctorCache = AutolinkingResolutionsCache;

export class NoAutolinkingDevDependenciesCheck implements DoctorCheck<DoctorCache> {
  description = 'Check that no autolinking modules are devDependencies';

  sdkVersionRange = '>=54.0.0';

  async runAsync(
    { pkg, projectRoot, exp }: DoctorCheckParams,
    cache: DoctorCache
  ): Promise<DoctorCheckResult> {
    const autolinkingModules = new Set<string>();

    try {
      const resolutions = await scanNativeModuleResolutions(cache, {
        projectRoot,
        sdkVersion: exp.sdkVersion!,
      });
      for (const dependencyName of resolutions.keys()) {
        autolinkingModules.add(dependencyName);
      }
    } catch (error) {
      if (error instanceof ExpoExportMissingError) {
        return {
          isSuccessful: false,
          issues: [error.message],
          advice: ["Reinstall your dependencies and check that they're not in a corrupted state."],
        };
      } else {
        return {
          isSuccessful: true,
          issues: [],
          advice: [],
        };
      }
    }

    const autolinkingDevDependencies: string[] = [];
    const devDependencies = pkg.devDependencies ?? {};
    const dependencies = pkg.dependencies ?? {};
    for (const dependencyName in devDependencies) {
      if (autolinkingModules.has(dependencyName) && !dependencies[dependencyName]) {
        autolinkingDevDependencies.push(dependencyName);
      }
    }

    if (!autolinkingDevDependencies.length) {
      return {
        isSuccessful: true,
        issues: [],
        advice: [],
      };
    }

    return {
      isSuccessful: false,
      issues: autolinkingDevDependencies.map((name) => {
        return `The package "${name}" is a native module and shouldn't be in "devDependencies".`;
      }),
      advice: [
        `Native modules are only autolinked from regular dependencies and not devDependencies.\n` +
          `Move any native modules from your package.json's "devDependencies" to regular "dependencies" and reinstall.`,
      ],
    };
  }
}
