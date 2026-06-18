import path from 'path';

// `src/ios/utils/xcodeShim/__tests__` -> package root (`@expo/config-plugins`).
const PACKAGE_ROOT = path.join(__dirname, '../../../../..');
// package root -> monorepo root (`config-plugins` -> `@expo` -> `packages` -> root).
const REPO_ROOT = path.join(PACKAGE_ROOT, '../../..');

const IOS_FIXTURES = path.join(PACKAGE_ROOT, 'src/ios/__tests__/fixtures');

// Read off disk verbatim so every backend starts from byte-identical input.
export const FIXTURES = {
  /** Bare React Native template the prebuild flow scaffolds. */
  bareMinimum: path.join(
    REPO_ROOT,
    'templates/expo-template-bare-minimum/ios/HelloWorld.xcodeproj/project.pbxproj'
  ),
  /** App + share-extension target. */
  multitarget: path.join(IOS_FIXTURES, 'project-multitarget.pbxproj'),
  watch: path.join(IOS_FIXTURES, 'watch.pbxproj'),
  framework: path.join(IOS_FIXTURES, 'project-with-framework.pbxproj'),
  entitlements: path.join(IOS_FIXTURES, 'project-with-entitlements.pbxproj'),
} as const;

export type FixtureName = keyof typeof FIXTURES;

export function fixturePath(name: FixtureName): string {
  return FIXTURES[name];
}
