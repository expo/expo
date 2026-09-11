'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  parsePodspecDeclarations,
  collectPodspecDeclarations,
  podspecDeclarations,
} = require('../podspec');

const spec = (...body) => ['Pod::Spec.new do |s|', ...body, 'end', ''].join('\n');

describe('parsePodspecDeclarations', () => {
  it('reads every frameworks/libraries syntax the repo uses', () => {
    expect(
      parsePodspecDeclarations(
        spec(
          "  s.frameworks     = 'Photos','PhotosUI'",
          '  s.frameworks = "AudioToolbox"',
          "  s.ios.frameworks = 'AVFoundation', 'CoreGraphics'",
          "  s.weak_frameworks = 'Speech'",
          "  s.libraries = 'sqlite3'",
          "  s.libraries = 'c++'"
        )
      )
    ).toEqual({
      frameworks: ['Photos', 'PhotosUI', 'AudioToolbox', 'AVFoundation', 'CoreGraphics', 'Speech'],
      libraries: ['sqlite3', 'c++'],
      iosDeploymentTarget: null,
    });
  });

  it('de-duplicates and keeps podspec order', () => {
    const { frameworks, libraries } = parsePodspecDeclarations(
      spec(
        "  s.frameworks = 'Photos', 'UIKit'",
        "  s.weak_frameworks = 'Photos'",
        "  s.libraries = 'c++', 'c++'"
      )
    );
    expect(frameworks).toEqual(['Photos', 'UIKit']);
    expect(libraries).toEqual(['c++']);
  });

  it('ignores test_spec blocks, other platforms and vendored frameworks', () => {
    expect(
      parsePodspecDeclarations(
        spec(
          '  s.vendored_frameworks = "#{s.name}.xcframework"',
          "  s.osx.frameworks = 'AppKit'",
          "  s.test_spec 'Tests' do |test_spec|",
          "    test_spec.frameworks = 'XCTest'",
          "    test_spec.libraries = 'stdc++'",
          '  end'
        )
      )
    ).toEqual({ frameworks: [], libraries: [], iosDeploymentTarget: null });
  });

  it('reads the iOS deployment target from the platforms hash', () => {
    expect(
      parsePodspecDeclarations(
        spec('  s.platforms      = {', "    :ios => '16.4',", "    :osx => '13.4'", '  }')
      ).iosDeploymentTarget
    ).toBe('16.4');
    expect(
      parsePodspecDeclarations(spec("  s.platforms = { :ios => '15.1', :tvos => '15.1' }"))
        .iosDeploymentTarget
    ).toBe('15.1');
    expect(
      parsePodspecDeclarations(spec("  s.platforms = { :osx => '13.4' }")).iosDeploymentTarget
    ).toBeNull();
  });
});

describe('collectPodspecDeclarations', () => {
  it('merges the podspecs found in the given directories, in order', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-podspecs-'));
    fs.mkdirSync(path.join(dir, 'ios'));
    fs.writeFileSync(
      path.join(dir, 'ios', 'ExpoCamera.podspec'),
      spec("  s.frameworks = 'AVFoundation'", "  s.platforms = { :ios => '16.4' }")
    );
    fs.writeFileSync(
      path.join(dir, 'ios', 'ExpoCameraBarcodeScanning.podspec'),
      spec("  s.frameworks = 'AVFoundation'", "  s.libraries = 'c++'")
    );
    fs.writeFileSync(path.join(dir, 'ios', 'notes.md'), '# not a podspec\n');

    expect(collectPodspecDeclarations([path.join(dir, 'ios'), dir])).toEqual({
      frameworks: ['AVFoundation'],
      libraries: ['c++'],
      iosDeploymentTarget: '16.4',
    });
  });

  it('returns nothing for a directory with no podspecs', () => {
    expect(collectPodspecDeclarations(['/nonexistent'])).toEqual({
      frameworks: [],
      libraries: [],
      iosDeploymentTarget: null,
    });
  });
});

describe('podspec parsing robustness', () => {
  it('ignores a trailing Ruby comment on a declaration', () => {
    const { frameworks, libraries } = parsePodspecDeclarations(
      spec(
        "  s.frameworks = 'Photos' # replaces 'AssetsLibrary'",
        "  s.libraries = 'sqlite3' # not 'bz2'",
        "  # s.frameworks = 'Contacts'"
      )
    );
    expect(frameworks).toEqual(['Photos']);
    expect(libraries).toEqual(['sqlite3']);
  });

  it('reads a multi-line array literal', () => {
    expect(
      parsePodspecDeclarations(
        spec(
          '  s.frameworks = [',
          "    'Photos',",
          "    'PhotosUI',",
          '  ]',
          "  s.libraries = ['c++']"
        )
      )
    ).toEqual({
      frameworks: ['Photos', 'PhotosUI'],
      libraries: ['c++'],
      iosDeploymentTarget: null,
    });
  });

  it('skips a test_spec block by its `do … end` depth, however it is indented', () => {
    expect(
      parsePodspecDeclarations(
        spec(
          "s.test_spec 'Tests' do |test_spec|",
          "test_spec.frameworks = 'XCTest'",
          "test_spec.source_files = 'Tests/**/*'",
          "if ENV['CI']",
          "test_spec.libraries = 'stdc++'",
          'end',
          'end',
          "  s.frameworks = 'Photos'"
        )
      ).frameworks
    ).toEqual(['Photos']);
  });

  it('only reads the platforms hash from a `platforms` assignment', () => {
    expect(
      parsePodspecDeclarations(
        spec(
          '  s.description = "platforms = { :ios => \'9.0\' }"',
          "  s.platforms = { :ios => '16.4' }"
        )
      ).iosDeploymentTarget
    ).toBe('16.4');
    expect(
      parsePodspecDeclarations(spec('  s.description = "platforms = { :ios => \'9.0\' }"'))
        .iosDeploymentTarget
    ).toBeNull();
  });
});

describe('podspecDeclarations', () => {
  const dirWith = (files) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-podname-'));
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
    return dir;
  };

  it("reads the pod's own podspec, ignoring its companions", () => {
    const dir = dirWith({
      'ExpoCamera.podspec': spec(
        "  s.frameworks = 'AVFoundation'",
        "  s.platforms = { :ios => '16.4' }"
      ),
      'ExpoCameraBarcodeScanning.podspec': spec(
        "  s.frameworks = 'Vision'",
        "  s.platforms = { :ios => '18.0' }"
      ),
    });
    expect(podspecDeclarations('ExpoCamera', [dir])).toEqual({
      frameworks: ['AVFoundation'],
      libraries: [],
      iosDeploymentTarget: '16.4',
    });
  });

  it('falls back to merging the directories when no podspec carries the pod name', () => {
    const dir = dirWith({
      'Legacy.podspec': spec("  s.frameworks = 'Photos'"),
      'Other.podspec': spec("  s.libraries = 'c++'"),
    });
    expect(podspecDeclarations('ExpoCamera', [dir])).toEqual({
      frameworks: ['Photos'],
      libraries: ['c++'],
      iosDeploymentTarget: null,
    });
  });
});
