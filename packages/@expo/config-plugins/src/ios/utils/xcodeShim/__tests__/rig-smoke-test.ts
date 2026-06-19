// Plumbing smoke test for the A/B build rig: confirms `EXPO_USE_LEGACY_XCODE`
// selects the backend that both `getPbxproj` and the `mods.ios.xcodeproj` provider
// route through (`openXcodeProject`), and that the two backends produce a
// semantically-equal pbxproj for a real mutation. The full prebuild + Xcode-build
// matrix across all plugins is a separate, heavier gate.

import { compareSemantics } from './comparator';
import { fixturePath } from './fixtures';
import { openXcodeProject } from '../backend';

function withLegacyXcode<T>(value: string | undefined, fn: () => T): T {
  const previous = process.env.EXPO_USE_LEGACY_XCODE;
  if (value === undefined) delete process.env.EXPO_USE_LEGACY_XCODE;
  else process.env.EXPO_USE_LEGACY_XCODE = value;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.EXPO_USE_LEGACY_XCODE;
    else process.env.EXPO_USE_LEGACY_XCODE = previous;
  }
}

describe('EXPO_USE_LEGACY_XCODE backend toggle', () => {
  it('selects legacy by default and the shim when disabled', () => {
    const def = withLegacyXcode(
      undefined,
      () => openXcodeProject(fixturePath('bareMinimum')).constructor.name
    );
    const legacy = withLegacyXcode(
      '1',
      () => openXcodeProject(fixturePath('bareMinimum')).constructor.name
    );
    const shim = withLegacyXcode(
      '0',
      () => openXcodeProject(fixturePath('bareMinimum')).constructor.name
    );

    expect(def).toBe(legacy);
    expect(shim).toBe('XcodeProjectShim');
    expect(shim).not.toBe(legacy);
  });

  it('legacy and shim backends produce a semantically-equal pbxproj', () => {
    const mutate = (project: any) =>
      project.addBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', '"com.example.rig"');

    const legacy = withLegacyXcode('1', () => {
      const project = openXcodeProject(fixturePath('bareMinimum'));
      mutate(project);
      return project.writeSync();
    });
    const shim = withLegacyXcode('0', () => {
      const project = openXcodeProject(fixturePath('bareMinimum'));
      mutate(project);
      return project.writeSync();
    });

    const diff = compareSemantics(legacy, shim);
    if (!diff.equal) {
      throw new Error(
        `semantic divergence at "${diff.path}": ${JSON.stringify(diff.legacy)} vs ${JSON.stringify(diff.shim)}`
      );
    }
  });
});
