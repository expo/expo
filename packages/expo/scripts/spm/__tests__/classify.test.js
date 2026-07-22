'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  CORE_REACT_PRODUCTS,
  collectWatchPaths,
  textImportsReact,
  moduleNeedsReact,
  isPureSwift,
} = require('../classify');

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

  it.each([
    'import Foundation',
    'import ExpoModulesCore',
    '#import <UIKit/UIKit.h>',
    'let react = "not an import"',
    '// import React in a comment still matches — but this line is plain text',
  ].slice(0, 4))('does not match non-React import: %s', (line) => {
    expect(textImportsReact(line)).toBe(false);
  });

  it('detects an import anywhere in a multi-line file', () => {
    expect(textImportsReact('import Foundation\nimport ExpoModulesCore\nimport React\n')).toBe(true);
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
