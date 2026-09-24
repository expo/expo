'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  CORE_REACT_PRODUCTS,
  collectWatchPaths,
  textImportsReact,
  sourceTreeImportsReact,
  collectIgnoredDirs,
  moduleNeedsReact,
  isPureSwift,
} = require('../classify');

function tmpTree(prefix, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  for (const [rel, content] of Object.entries(files)) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return root;
}

describe('textImportsReact', () => {
  it.each([
    '#import <React/RCTBridge.h>',
    '#import <react/renderer/core/Props.h>',
    '#import "ReactCommon/CallInvoker.h"',
    '#import <hermes/hermes.h>',
    'import React',
    '@import jsi;',
    'internal import ReactAppDependencyProvider',
  ])('matches React/Hermes/jsi import: %s', (line) => {
    expect(textImportsReact(line)).toBe(true);
  });

  it.each(
    [
      'import Foundation',
      'import ExpoModulesCore',
      '#import <UIKit/UIKit.h>',
      'let react = "not an import"',
      '// import React in a comment still matches — but this line is plain text',
    ].slice(0, 4)
  )('does not match non-React import: %s', (line) => {
    expect(textImportsReact(line)).toBe(false);
  });

  it('detects an import anywhere in a multi-line file', () => {
    expect(textImportsReact('import Foundation\nimport ExpoModulesCore\nimport React\n')).toBe(
      true
    );
  });
});

describe('moduleNeedsReact', () => {
  it('returns true for the core bridge products regardless of source', () => {
    for (const core of CORE_REACT_PRODUCTS) {
      expect(moduleNeedsReact(core, '/nonexistent')).toBe(true);
    }
  });

  it('returns true when a module source imports React, false when it only uses the Expo API', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-needsreact-'));
    try {
      fs.mkdirSync(path.join(root, 'ios'));
      fs.writeFileSync(path.join(root, 'ios', 'A.swift'), 'import ExpoModulesCore\n');
      expect(moduleNeedsReact('ExpoAsset', root)).toBe(false);

      fs.writeFileSync(path.join(root, 'ios', 'B.mm'), '#import <React/RCTBridge.h>\n');
      expect(moduleNeedsReact('ExpoAsset', root)).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('isPureSwift', () => {
  it('is true for a Swift-only source tree and false when a .mm/.cpp is present', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-pureswift-'));
    try {
      fs.mkdirSync(path.join(root, 'ios'));
      fs.writeFileSync(path.join(root, 'ios', 'A.swift'), '// swift\n');
      expect(isPureSwift(root)).toBe(true);

      fs.writeFileSync(path.join(root, 'ios', 'B.mm'), '// objc++\n');
      expect(isPureSwift(root)).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('is false when a generated C source sits in the production tree', () => {
    const root = tmpTree('expo-spm-pureswift-c-', {
      'ios/A.swift': '// swift\n',
      'ios/sqlite3.c': '/* generated */\n',
    });
    try {
      expect(isPureSwift(root)).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('stays pure-Swift when the only C source is inside an ignored directory', () => {
    const root = tmpTree('expo-spm-pureswift-c-ignored-', {
      'ios/A.swift': '// swift\n',
      'ios/Tests/fixture.c': '/* test fixture */\n',
    });
    try {
      expect(isPureSwift(root)).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('ignores test/build directories when scanning for non-Swift sources', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-pureswift-ignore-'));
    try {
      fs.mkdirSync(path.join(root, 'ios', 'Tests'), { recursive: true });
      fs.writeFileSync(path.join(root, 'ios', 'A.swift'), '// swift\n');
      fs.writeFileSync(path.join(root, 'ios', 'Tests', 'T.mm'), '// objc++ in tests\n');
      expect(isPureSwift(root)).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('collectWatchPaths', () => {
  it('returns only the manifest/config files that exist, per module root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-'));
    const withBoth = path.join(root, 'with-both');
    const withConfig = path.join(root, 'with-config');
    const withNeither = path.join(root, 'with-neither');
    for (const dir of [withBoth, withConfig, withNeither]) fs.mkdirSync(dir);
    fs.writeFileSync(path.join(withBoth, 'Package.swift'), '// manifest');
    fs.writeFileSync(path.join(withBoth, 'expo-module.config.json'), '{}');
    fs.writeFileSync(path.join(withConfig, 'expo-module.config.json'), '{}');

    expect(collectWatchPaths([withBoth, withConfig, withNeither])).toEqual([
      path.join(withBoth, 'Package.swift'),
      path.join(withBoth, 'expo-module.config.json'),
      path.join(withConfig, 'expo-module.config.json'),
    ]);
  });
});

describe('sourceTreeImportsReact', () => {
  it('scans C sources for React imports', () => {
    const root = tmpTree('expo-spm-react-c-', {
      'ios/bridge.c': '#import <React/RCTBridge.h>\n',
    });
    try {
      expect(sourceTreeImportsReact(path.join(root, 'ios'))).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('collectIgnoredDirs', () => {
  it('collects every ignored directory at any depth, relative and sorted', () => {
    const root = tmpTree('expo-spm-ignored-', {
      'ios/A.swift': '// swift\n',
      'ios/Tests/T.swift': '// tests\n',
      'ios/__tests__/T.swift': '// tests\n',
      'ios/node_modules/dep/D.swift': '// vendored\n',
      'ios/build/B.swift': '// output\n',
      'ios/.build/B.swift': '// output\n',
      'ios/Feature/Tests/T.swift': '// nested tests\n',
      'ios/Feature/Impl.swift': '// swift\n',
    });
    try {
      expect(collectIgnoredDirs(path.join(root, 'ios'))).toEqual([
        '.build',
        'Feature/Tests',
        'Tests',
        '__tests__',
        'build',
        'node_modules',
      ]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not descend into an already-excluded directory', () => {
    const root = tmpTree('expo-spm-ignored-nested-', {
      'ios/Tests/node_modules/dep/D.swift': '// vendored inside tests\n',
    });
    try {
      expect(collectIgnoredDirs(path.join(root, 'ios'))).toEqual(['Tests']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('returns nothing for a clean source tree or a missing directory', () => {
    const root = tmpTree('expo-spm-ignored-clean-', { 'ios/A.swift': '// swift\n' });
    try {
      expect(collectIgnoredDirs(path.join(root, 'ios'))).toEqual([]);
      expect(collectIgnoredDirs(path.join(root, 'apple'))).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
