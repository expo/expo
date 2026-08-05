import type {
  ConfigPluginSourceType,
  FingerprintPreset,
  NativeModuleSourceType,
} from './Fingerprint.types';
import { SourceSkips } from './sourcer/SourceSkips';

export interface ResolvedPreset {
  sourceSkips: SourceSkips;
  nativeModuleSourceType: NativeModuleSourceType;
  configPluginSourceType: ConfigPluginSourceType;
}

/**
 * The preset used when a project doesn't configure one.
 */
export const DEFAULT_PRESET: FingerprintPreset = 'balanced';

/**
 * Resolve a preset name to the settings it stands for.
 *
 * - `strict`: highest fidelity - the historical default. Only skips prebuild-mutated package.json
 *   scripts so a fingerprint stays consistent before and after prebuild.
 * - `balanced`: the default. Also ignores app version and string runtime version churn, and hashes
 *   autolinked packages and node_modules config-plugin modules by their `package.json` version.
 *   Best first-time experience.
 * - `relaxed`: for building multiple variants from one native project. Additionally ignores app
 *   names, bundle identifiers, schemes, and assets, while still hashing the config-plugins list so
 *   adding a plugin still changes the fingerprint.
 */
export function resolvePreset(preset: FingerprintPreset): ResolvedPreset {
  switch (preset) {
    case 'strict':
      return {
        sourceSkips: SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun,
        nativeModuleSourceType: 'files',
        configPluginSourceType: 'files',
      };
    case 'balanced':
      return {
        sourceSkips:
          SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun |
          SourceSkips.ExpoConfigVersions |
          SourceSkips.ExpoConfigRuntimeVersionIfString,
        nativeModuleSourceType: 'package',
        configPluginSourceType: 'package',
      };
    case 'relaxed':
      return {
        sourceSkips:
          SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun |
          SourceSkips.ExpoConfigVersions |
          SourceSkips.ExpoConfigRuntimeVersionIfString |
          SourceSkips.ExpoConfigNames |
          SourceSkips.ExpoConfigAndroidPackage |
          SourceSkips.ExpoConfigIosBundleIdentifier |
          SourceSkips.ExpoConfigSchemes |
          SourceSkips.ExpoConfigAssets,
        nativeModuleSourceType: 'package',
        configPluginSourceType: 'package',
      };
    default:
      throw new Error(
        `Invalid fingerprint preset: ${preset}. Supported presets are 'strict', 'balanced', and 'relaxed'.`
      );
  }
}
