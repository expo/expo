'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { readPodfileProperties, resolveAppTarget } = require('../app-target');

// The real project of apps/minimal-swiftpm: the entitlements derivation reads an
// Xcode project, so mocking one out would only assert our own fixture back.
const TESTER_PBXPROJ = fs.readFileSync(
  path.join(
    __dirname,
    '../../../../..',
    'apps/minimal-swiftpm/ios/minimalswiftpm.xcodeproj/project.pbxproj'
  ),
  'utf8'
);

const ENTITLEMENTS_LINE = /^[ \t]*CODE_SIGN_ENTITLEMENTS = .*;\n/gm;
const DEBUG = 0;
const RELEASE = 1;

/** Rewrite the nth `CODE_SIGN_ENTITLEMENTS` line; the app target declares Debug first. */
function withEntitlementsSetting(pbxproj, index, replacement) {
  let seen = 0;
  return pbxproj.replace(ENTITLEMENTS_LINE, (line) =>
    seen++ === index ? replacement.replace('$', line.match(/^[ \t]*/)[0]) : line
  );
}

function withoutEntitlementsSettings(pbxproj) {
  return pbxproj.replace(ENTITLEMENTS_LINE, '');
}

/**
 * Append a unit-test target declaring its own entitlements. The tester project has a
 * single application target, so without a second one no test can tell a lookup by name
 * apart from `findFirstNativeTarget`.
 */
function withTestTarget(pbxproj, name = 'minimalswiftpmTests') {
  return pbxproj
    .replace(
      '/* End PBXNativeTarget section */',
      `\t\tAAAA0000000000000000001 /* ${name} */ = {
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = AAAA0000000000000000002 /* Build configuration list for PBXNativeTarget "${name}" */;
\t\t\tbuildPhases = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = ${name};
\t\t\tproductName = ${name};
\t\t\tproductType = "com.apple.product-type.bundle.unit-test";
\t\t};
/* End PBXNativeTarget section */`
    )
    .replace(
      '/* End XCConfigurationList section */',
      `\t\tAAAA0000000000000000002 /* Build configuration list for PBXNativeTarget "${name}" */ = {
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\tAAAA0000000000000000003 /* Debug */,
\t\t\t\tAAAA0000000000000000004 /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t};
/* End XCConfigurationList section */`
    )
    .replace(
      '/* End XCBuildConfiguration section */',
      ['Debug', 'Release']
        .map(
          (
            configuration,
            index
          ) => `\t\tAAAA000000000000000000${index + 3} /* ${configuration} */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
\t\t\t\tCODE_SIGN_ENTITLEMENTS = ${name}/${name}.entitlements;
\t\t\t};
\t\t\tname = ${configuration};
\t\t};
`
        )
        .join('') + '/* End XCBuildConfiguration section */'
    );
}

function makeApp({
  pbxproj = TESTER_PBXPROJ,
  entitlements = ['minimalswiftpm/minimalswiftpm.entitlements'],
  marker = { target: 'minimalswiftpm' },
  projectDirName = 'ios',
} = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-app-target-'));
  const appRoot = path.join(tmp, projectDirName);
  const project = path.join(appRoot, 'minimalswiftpm.xcodeproj');
  fs.mkdirSync(project, { recursive: true });
  if (pbxproj != null) fs.writeFileSync(path.join(project, 'project.pbxproj'), pbxproj);
  if (marker != null) {
    fs.writeFileSync(path.join(project, '.spm-injected.json'), JSON.stringify(marker));
  }
  for (const relative of entitlements) {
    const file = path.join(appRoot, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '<plist version="1.0"><dict/></plist>');
  }
  return appRoot;
}

let warn;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

const warnings = () => warn.mock.calls.map(([text]) => text).join('\n');

describe('the Xcode target name', () => {
  it('comes from the injection marker of the Xcode project', () => {
    expect(resolveAppTarget(makeApp()).targetName).toBe('minimalswiftpm');
  });

  it('is omitted when no Xcode project carries a marker', () => {
    expect(resolveAppTarget(makeApp({ marker: null })).targetName).toBeNull();
  });

  // RN's injector takes the first marker it finds; guessing the same one is not
  // safe, but a silently dropped --target-name is undiagnosable, so say it.
  it('is omitted with a warning when several Xcode projects carry a marker', () => {
    const appRoot = makeApp();
    const stale = path.join(appRoot, 'stale.xcodeproj');
    fs.mkdirSync(stale, { recursive: true });
    fs.writeFileSync(path.join(stale, 'project.pbxproj'), TESTER_PBXPROJ);
    fs.writeFileSync(path.join(stale, '.spm-injected.json'), JSON.stringify({ target: 'stale' }));

    expect(resolveAppTarget(appRoot).targetName).toBeNull();
    expect(warnings()).toContain('minimalswiftpm.xcodeproj');
    expect(warnings()).toContain('stale.xcodeproj');
  });

  // A leftover directory with no project in it is not a project RN can inject into.
  it('ignores a marker in an .xcodeproj without a project.pbxproj', () => {
    const appRoot = makeApp();
    const stale = path.join(appRoot, 'Stale.xcodeproj');
    fs.mkdirSync(stale);
    fs.writeFileSync(path.join(stale, '.spm-injected.json'), JSON.stringify({ target: 'stale' }));

    expect(resolveAppTarget(appRoot).targetName).toBe('minimalswiftpm');
    expect(warn).not.toHaveBeenCalled();
  });

  it('is omitted when the marker is unreadable or names no target', () => {
    expect(resolveAppTarget(makeApp({ marker: { rootUuid: 'ABC' } })).targetName).toBeNull();

    const appRoot = makeApp({ marker: null });
    fs.writeFileSync(
      path.join(appRoot, 'minimalswiftpm.xcodeproj', '.spm-injected.json'),
      '{ not json'
    );
    expect(resolveAppTarget(appRoot).targetName).toBeNull();
  });

  it('is omitted when the Xcode project directory does not exist', () => {
    expect(
      resolveAppTarget(path.join(os.tmpdir(), 'expo-spm-absent', 'ios')).targetName
    ).toBeNull();
  });
});

describe('the entitlements file', () => {
  it('is the one the app target declares', () => {
    const appRoot = makeApp();
    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
    );
  });

  // CocoaPods scans every build configuration of the target. Reading only Release
  // leaves an app that signs entitlements in Debug with empty app groups.
  it('is found when only the Debug configuration declares it', () => {
    const appRoot = makeApp({
      pbxproj: withEntitlementsSetting(TESTER_PBXPROJ, RELEASE, ''),
    });
    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
    );
  });

  it('is resolved for the target the marker names, not the first application target', () => {
    const appRoot = makeApp({
      pbxproj: withTestTarget(TESTER_PBXPROJ),
      marker: { target: 'minimalswiftpmTests' },
      entitlements: [
        'minimalswiftpm/minimalswiftpm.entitlements',
        'minimalswiftpmTests/minimalswiftpmTests.entitlements',
      ],
    });
    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpmTests/minimalswiftpmTests.entitlements')
    );
  });

  it('is omitted when the marker names a target the project does not have', () => {
    const appRoot = makeApp({ marker: { target: 'renamed' } });
    expect(resolveAppTarget(appRoot).entitlementPath).toBeNull();
    expect(warnings()).toContain('"renamed"');
    expect(warnings()).toContain('react-native spm update');
    // The project parsed fine; only the target was missing.
    expect(warnings()).not.toContain('could not be read');
  });

  // An empty setting resolves to the project directory, which exists — so without a
  // file check it wins and suppresses the file another configuration declares.
  it('ignores a configuration whose entitlements setting is empty', () => {
    const appRoot = makeApp({
      pbxproj: withEntitlementsSetting(TESTER_PBXPROJ, DEBUG, '$CODE_SIGN_ENTITLEMENTS = "";\n'),
    });
    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
    );
  });

  it.each([['$(SRCROOT)'], ['${SRCROOT}']])(
    'warns and skips a setting built from the %s build variable',
    (variable) => {
      const appRoot = makeApp({
        pbxproj: withEntitlementsSetting(
          TESTER_PBXPROJ,
          DEBUG,
          `$CODE_SIGN_ENTITLEMENTS = "${variable}/minimalswiftpm/minimalswiftpm.entitlements";\n`
        ),
      });
      expect(resolveAppTarget(appRoot).entitlementPath).toBe(
        path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
      );
      expect(warnings()).toContain(variable);
      // Skipped outright, so it is not one of two "different entitlements files".
      expect(warnings()).not.toContain('declare different entitlements files');
    }
  );

  // An app that signs no entitlements at all is the common case, not a problem.
  it('is omitted silently when no build configuration declares one', () => {
    const pbxproj = withoutEntitlementsSettings(TESTER_PBXPROJ);
    expect(resolveAppTarget(makeApp({ pbxproj })).entitlementPath).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('is omitted with a warning when the declared file is not on disk', () => {
    const appRoot = makeApp({ entitlements: [] });
    expect(resolveAppTarget(appRoot).entitlementPath).toBeNull();
    expect(warnings()).toContain(path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements'));
    expect(warnings()).toContain('app groups');
  });

  it('is omitted with a warning when the Xcode project cannot be read', () => {
    const appRoot = makeApp({ pbxproj: 'not a pbxproj' });
    expect(resolveAppTarget(appRoot).entitlementPath).toBeNull();
    expect(warnings()).toContain(path.join(appRoot, 'minimalswiftpm.xcodeproj'));
    expect(warnings()).toContain('app groups');
  });

  it('is omitted with a warning when there is no Xcode project', () => {
    const appRoot = makeApp({ pbxproj: null });
    expect(resolveAppTarget(appRoot).entitlementPath).toBeNull();
    expect(warnings()).toContain(appRoot);
    expect(warnings()).toContain('no .xcodeproj');
    expect(warnings()).toContain('app groups');
  });

  it('is read from a marked Xcode project only when it has a project.pbxproj', () => {
    const appRoot = makeApp({ marker: null });
    const stale = path.join(appRoot, 'Stale.xcodeproj');
    fs.mkdirSync(stale);
    fs.writeFileSync(
      path.join(stale, '.spm-injected.json'),
      JSON.stringify({ target: 'minimalswiftpm' })
    );

    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
    );
  });

  // Matches IOSConfig.Paths.getAllPBXProjectPaths, which `expo prebuild` writes through.
  it('is read from the Xcode project config-plugins would pick when none carries a marker', () => {
    const appRoot = makeApp({ pbxproj: null, marker: null });
    fs.mkdirSync(path.join(appRoot, 'Aardvark.xcodeproj'));
    for (const [name, pbxproj] of [
      ['alpha', TESTER_PBXPROJ],
      ['Zebra', withoutEntitlementsSettings(TESTER_PBXPROJ)],
    ]) {
      fs.mkdirSync(path.join(appRoot, `${name}.xcodeproj`));
      fs.writeFileSync(path.join(appRoot, `${name}.xcodeproj`, 'project.pbxproj'), pbxproj);
    }

    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
    );
  });

  it('is found when the Xcode project directory is not named ios', () => {
    const appRoot = makeApp({ projectDirName: 'App' });
    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
    );
  });

  // Reading whichever project sorts first would miss the target and blame a rename.
  it('is read from the Xcode project that carries the marker, not the first one', () => {
    const appRoot = makeApp({
      pbxproj: withTestTarget(TESTER_PBXPROJ),
      marker: { target: 'minimalswiftpmTests' },
      entitlements: ['minimalswiftpmTests/minimalswiftpmTests.entitlements'],
    });
    const unmarked = path.join(appRoot, 'Archived.xcodeproj');
    fs.mkdirSync(unmarked);
    fs.writeFileSync(path.join(unmarked, 'project.pbxproj'), TESTER_PBXPROJ);

    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpmTests/minimalswiftpmTests.entitlements')
    );
    expect(warnings()).not.toContain('renamed');
  });

  it('is read from the first application target when no Xcode project carries a marker', () => {
    const appRoot = makeApp({ marker: null });
    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
    );
  });

  // Both configurations normally declare the same file; warning about that would
  // put a spurious line in every sync.
  it('says nothing when every build configuration declares the same file', () => {
    expect(resolveAppTarget(makeApp()).entitlementPath).not.toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when the build configurations declare different files', () => {
    const appRoot = makeApp({
      pbxproj: withEntitlementsSetting(
        TESTER_PBXPROJ,
        DEBUG,
        '$CODE_SIGN_ENTITLEMENTS = minimalswiftpm/debug.entitlements;\n'
      ),
    });
    expect(resolveAppTarget(appRoot).entitlementPath).toBe(
      path.join(appRoot, 'minimalswiftpm/minimalswiftpm.entitlements')
    );
    expect(warnings()).toContain('debug.entitlements');
    expect(warnings()).toContain('minimalswiftpm.entitlements');
  });
});

describe('the Podfile properties file', () => {
  it('is taken from the Xcode project directory when it exists', () => {
    const appRoot = makeApp();
    const properties = path.join(appRoot, 'Podfile.properties.json');
    fs.writeFileSync(properties, '{}');
    expect(resolveAppTarget(appRoot).podfilePropertiesPath).toBe(properties);
  });

  it('is omitted when the app has none', () => {
    expect(resolveAppTarget(makeApp()).podfilePropertiesPath).toBeNull();
  });
});

describe('the Podfile properties', () => {
  let tmp;
  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-podfile-properties-'));
  });

  /** Writes a Podfile.properties.json with `contents` and returns its path. */
  const propertiesFile = (name, contents) => {
    const file = path.join(tmp, name, 'Podfile.properties.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
    return file;
  };

  const thrownBy = (file) => {
    try {
      readPodfileProperties(file);
    } catch (error) {
      return error;
    }
    throw new Error(`${file} was read as properties instead of being refused`);
  };

  it('are the properties the file declares', () => {
    const file = propertiesFile(
      'app',
      JSON.stringify({ 'expo.jsEngine': 'hermes', 'expo.camera.barcode-scanner-enabled': 'false' })
    );
    expect(readPodfileProperties(file)).toEqual({
      'expo.jsEngine': 'hermes',
      'expo.camera.barcode-scanner-enabled': 'false',
    });
    expect(warn).not.toHaveBeenCalled();
  });

  // A file that vanished between `resolveAppTarget` finding it and this read is the
  // same situation as an app that never ran CocoaPods, not a broken file.
  it('are empty and silent when there is no file to read', () => {
    const vanished = path.join(tmp, 'vanished', 'Podfile.properties.json');
    fs.mkdirSync(path.dirname(vanished), { recursive: true });
    const absent = path.join(tmp, 'absent', 'Podfile.properties.json');
    for (const input of [undefined, null, '', {}, [], absent, vanished]) {
      expect(readPodfileProperties(input)).toEqual({});
    }
    expect(warn).not.toHaveBeenCalled();
  });

  // The namespace is what makes a failed sync attributable to this plugin, and a
  // stop is not one of this file's warnings however it is worded.
  it('fail the sync with a namespaced error rather than a warning', () => {
    const { message } = thrownBy(propertiesFile('namespaced', 'null'));
    expect(message.startsWith('[expo-spm-plugin] ')).toBe(true);
    expect(message).not.toContain('WARNING');
    expect(message).toContain('leave each gated product to its own default');
    expect(message).toContain('npx react-native spm update');
  });

  // An unset property leaves its gate at that gate's own default, so no fallback is
  // neutral: a clobbered file read as no properties links or drops products against
  // the app's configuration, silently.
  it('fail the sync when the file is not valid JSON', () => {
    const file = propertiesFile('malformed', '{ "expo.jsEngine": ');
    const error = thrownBy(file);
    expect(error.message).toContain(`${file} could not be read as Podfile properties`);
    expect(error.message).toContain(error.cause.message);
    expect(error.cause).toBeInstanceOf(Error);
    expect(warn).not.toHaveBeenCalled();
  });

  it('fail the sync when the file cannot be read', () => {
    const directory = path.join(tmp, 'unreadable', 'Podfile.properties.json');
    fs.mkdirSync(directory, { recursive: true });
    const error = thrownBy(directory);
    expect(error.message).toContain(directory);
    expect(error.message).toContain(error.cause.message);
    expect(error.cause.code).toBe('EISDIR');
  });

  // CocoaPods writes an object; anything else is a file some other tool clobbered.
  it.each([
    ['[]', 'an array'],
    ['"hermes"', 'a string'],
    ['17', 'a number'],
    ['null', 'null'],
    ['true', 'a boolean'],
  ])('fail the sync when the file holds %s instead of an object', (contents, held) => {
    const file = propertiesFile(`not-an-object-${encodeURIComponent(contents)}`, contents);
    const error = thrownBy(file);
    expect(error.message).toContain(`${file} could not be read as Podfile properties`);
    expect(error.message).toContain(`it holds ${held}, not an object`);
    expect(error.cause).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  // The error describes the payload's type and never renders the payload: a
  // structure this deep parses fine and then overflows the stack in
  // `JSON.stringify`, which would replace the diagnostic with a stack overflow.
  it('fail the sync for a payload no one can print', () => {
    const depth = 50_000;
    const file = propertiesFile('too-deep', '['.repeat(depth) + ']'.repeat(depth));
    expect(thrownBy(file).message).toContain('it holds an array, not an object');
  });
});
