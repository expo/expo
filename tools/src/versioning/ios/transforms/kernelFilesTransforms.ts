import { TransformPipeline } from '.';

/**
 * These modification will be run against `ios/Exponent/kernel` directory.
 * If you need to modify other files from the `ios` directory then find
 * a better place for it or refactor the function that depends on this list.
 * The nature of these changes is that they're not permanent and at one point
 * of time (SDK drop) these should be rollbacked.
 * @param versionName e.g. 21.0.0, 37.0.0, etc.
 * @param rollback This flag indicates whether the change should be rollbacked.
 */
export function kernelFilesTransforms(
  versionName: string,
  rollback: boolean = false
): TransformPipeline {
  return {
    transforms: [
      {
        paths: ['EXAppViewController.m'],
        ...withRollback(rollback, {
          replace: /(?<=#import <React\/RCTAppearance\.h>)/,
          with: `\n#if defined(INCLUDES_VERSIONED_CODE) && __has_include(<${versionName}React/${versionName}RCTAppearance.h>)\n#import <${versionName}React/${versionName}RCTAppearance.h>\n#endif`,
        }),
      },
      {
        paths: ['EXAppViewController.m'],
        ...withRollback(rollback, {
          replace: /(?<=\sRCTOverrideAppearancePreference\(appearancePreference\);)/,
          with: `\n#if defined(INCLUDES_VERSIONED_CODE) && __has_include(<${versionName}React/${versionName}RCTAppearance.h>)\n  ${versionName}RCTOverrideAppearancePreference(appearancePreference);\n#endif`,
        }),
      },
    ],
  };
}

type Replacement = {
  replace: RegExp | string;
  with: string;
};

/**
 * If `rollback = true` then this function either return `rollbackReplacement`
 * or if it's not provided it used `replace` from `replacement` argument.
 * For the latter case, ensure you're not constructing `replacement.with` field with
 * any capture group from `replacement.replace` part, because it will be inlined directly
 * and additionally ensure if you don't want to escape some characters 🤔.
 */
function withRollback(
  rollback: boolean,
  replacement: Replacement,
  rollbackReplacement?: Replacement
): Replacement {
  return rollback ? rollbackReplacement ?? { replace: replacement.with, with: '' } : replacement;
}
