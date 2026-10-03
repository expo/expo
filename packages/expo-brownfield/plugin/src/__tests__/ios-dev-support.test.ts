import fs from 'node:fs';
import path from 'node:path';

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

const readTemplate = (relativePath: string) =>
  fs.readFileSync(path.join(TEMPLATES_DIR, relativePath), 'utf8');

/**
 * iOS picks its bundle in `ReactNativeDelegate.bundleURL()`, which was a pure `#if DEBUG` switch —
 * a compile-time decision the host could not opt out of. Running a debug XCFramework without Metro
 * needs that to consult a runtime flag, while leaving the release path compile-time as it was.
 */
describe('ios templates — dev support override', () => {
  it('consults the runtime flag before reaching for Metro', () => {
    const delegate = readTemplate('ios/ReactNativeDelegate.swift');

    expect(delegate).toContain('ReactNativeHostManager.shared.useDevSupport');
    // The Metro URL must sit behind the runtime check, not replace it.
    expect(delegate).toContain('RCTBundleURLProvider.sharedSettings().jsBundleURL(');
  });

  it('keeps the embedded-bundle path compiled into release builds', () => {
    const delegate = readTemplate('ios/ReactNativeDelegate.swift');

    // `#if DEBUG` still guards the Metro branch, so release binaries never link it.
    expect(delegate).toContain('#if DEBUG');
    expect(delegate).toContain('Bundle(for: ReactNativeHostManager.self)');
  });

  it('points a missing debug bundle at the config plugin option', () => {
    const delegate = readTemplate('ios/ReactNativeDelegate.swift');

    expect(delegate).toContain('bundleInDebug');
  });

  it('exposes useDevSupport on the host manager with a build-type default', () => {
    const manager = readTemplate('ios/ReactNativeHostManager.swift');

    expect(manager).toContain('public private(set) var useDevSupport');
    expect(manager).toContain('defaultUseDevSupport');
  });

  it('keeps the existing Objective-C initializer selector intact', () => {
    const manager = readTemplate('ios/ReactNativeHostManager.swift');

    // `ReactNativeHostManager` is part of the Objective-C surface; adding a parameter to the
    // existing selector would break ObjC callers, so the new form is a separate selector.
    expect(manager).toContain('@objc(initializeWithTurboModuleClasses:)');
    expect(manager).toContain('@objc(initializeWithTurboModuleClasses:useDevSupport:)');
  });
});
