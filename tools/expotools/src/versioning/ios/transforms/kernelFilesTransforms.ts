import { TransformPipeline } from '.';

/**
 * These modification will be run against `ios/Exponent/kernel` directory.
 * If you need to modify other files from the `ios` directory then find
 * a better place for it or refactor the function that depends on this list.
 * @param versionName e.g. 21.0.0, 37.0.0, etc.
 */
export function kernelFilesTransforms(versionName: string): TransformPipeline {
  return {
    transforms: [
      {
        paths: ['EXAppViewController.m'],
        replace: /(#import <React\/RCTAppearance\.h>)/,
        with: `$1\n\n#if __has_include(<${versionName}React/${versionName}RCTAppearance.h>)\n#import <${versionName}React/${versionName}RCTAppearance.h>\n#endif`,
      },
      {
        paths: ['EXAppViewController.m'],
        replace: /(\sRCTOverrideAppearancePreference\(appearancePreference\);)/,
        with: `$1\n#if __has_include(<${versionName}React/${versionName}RCTAppearance.h>)\n  ${versionName}RCTOverrideAppearancePreference(appearancePreference);\n#endif`,
      },
    ],
  };
}
