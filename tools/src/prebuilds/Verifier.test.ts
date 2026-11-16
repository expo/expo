/**
 * Tests for the xcframework verifier's swiftinterface checks:
 *  - findInternalTargetModuleReferences (internal SPM target names left in a .swiftinterface)
 *  - verifySwiftInterfaceImports (the check that turns those references into a failure)
 */
import fs from 'fs-extra';
import assert from 'node:assert/strict';
import os from 'node:os';
import { afterEach, describe, it } from 'node:test';
import path from 'path';

import { findInternalTargetModuleReferences, verifySwiftInterfaceImports } from './Verifier';

const FRAMEWORK_NAME = 'ExpoModulesCore';

describe('findInternalTargetModuleReferences', () => {
  it('reports a module selector reference to an internal target', () => {
    assert.deepEqual(
      findInternalTargetModuleReferences(
        'public func register(_ registry: ExpoModulesCore_ios_objc::EXModuleRegistry)',
        FRAMEWORK_NAME
      ),
      [{ module: 'ExpoModulesCore_ios_objc', count: 1, separators: ['::'] }]
    );
  });

  it('reports a dot-qualified reference to an internal target', () => {
    assert.deepEqual(
      findInternalTargetModuleReferences(
        'public func register(_ registry: ExpoModulesCore_ios_objc.EXModuleRegistry)',
        FRAMEWORK_NAME
      ),
      [{ module: 'ExpoModulesCore_ios_objc', count: 1, separators: ['.'] }]
    );
  });

  it('reports each module once, with every occurrence and separator it found', () => {
    const contents = [
      'public var registry: ExpoModulesCore_ios_objc::EXModuleRegistry',
      'public var legacy: ExpoModulesCore_ios_objc.EXLegacyModuleRegistry',
      'public var appContext: ExpoModulesCore_ios_objc::EXAppContext',
      'public var events: ExpoModulesCore_common_cpp::EventEmitter',
    ].join('\n');

    assert.deepEqual(findInternalTargetModuleReferences(contents, FRAMEWORK_NAME), [
      { module: 'ExpoModulesCore_ios_objc', count: 3, separators: ['::', '.'] },
      { module: 'ExpoModulesCore_common_cpp', count: 1, separators: ['::'] },
    ]);
  });

  it('reports an internal target of another package, which this build cannot rewrite', () => {
    assert.deepEqual(
      findInternalTargetModuleReferences(
        'public var object: ExpoModulesJSI_ios_objc.JavaScriptObject',
        FRAMEWORK_NAME
      ),
      [{ module: 'ExpoModulesJSI_ios_objc', count: 1, separators: ['.'] }]
    );
  });

  it('reports internal targets named after their product rather than their kind', () => {
    assert.deepEqual(
      findInternalTargetModuleReferences('public var db: ExpoSQLite_c::sqlite3', 'ExpoSQLite'),
      [{ module: 'ExpoSQLite_c', count: 1, separators: ['::'] }]
    );
    assert.deepEqual(
      findInternalTargetModuleReferences(
        'public var view: RNReanimated_view::REAView',
        'RNReanimated'
      ),
      [{ module: 'RNReanimated_view', count: 1, separators: ['::'] }]
    );
  });

  it('reports a lowercase internal target name', () => {
    assert.deepEqual(
      findInternalTargetModuleReferences(
        'public var spec: rnskia_codegen_modules::NativeSkiaSpec',
        'RNSkia'
      ),
      [{ module: 'rnskia_codegen_modules', count: 1, separators: ['::'] }]
    );
  });

  it('reports nothing for an interface that only names product modules', () => {
    const contents = [
      '// swift-interface-format-version: 1.0',
      '@_exported import ExpoModulesCore',
      'import Swift',
      'public var name: Swift::String',
      'public var view: ExpoModulesCore::ExpoView',
      'public var legacy: ExpoModulesCore.ExpoView',
      'public var object: ExpoModulesJSI::JavaScriptObject',
    ].join('\n');

    assert.deepEqual(findInternalTargetModuleReferences(contents, FRAMEWORK_NAME), []);
  });

  it('ignores an internal target name that is not in a qualified position', () => {
    const contents = [
      '/// Bridges to expo::createReactSchedulerHandle in ExpoModulesCore_common_cpp.',
      'import ExpoModulesCore_ios_objc',
      'public var suffixOnly: my_cpp_helpers::Thing',
    ].join('\n');

    assert.deepEqual(findInternalTargetModuleReferences(contents, FRAMEWORK_NAME), []);
  });

  it('does not treat every leading-underscore module as internal when the framework is unnamed', () => {
    const contents = [
      'public var task: _Concurrency.Task<Swift.Void, Swift.Never>',
      'public var regex: _StringProcessing.Regex<Swift.Substring>',
    ].join('\n');

    assert.deepEqual(findInternalTargetModuleReferences(contents, ''), []);
  });
});

describe('verifySwiftInterfaceImports', () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => fs.remove(root)));
  });

  /** Lays out the part of a built framework the import check reads: a modulemap and one interface. */
  async function createFrameworkFixtureAsync(interfaceContents: string): Promise<{
    frameworkPath: string;
    swiftInterfacePath: string;
  }> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'verifier-swiftinterface-'));
    tempRoots.push(root);

    const frameworkPath = path.join(root, `${FRAMEWORK_NAME}.framework`);
    await fs.outputFile(
      path.join(frameworkPath, 'Modules', 'module.modulemap'),
      `framework module ${FRAMEWORK_NAME} {\n}\n`
    );

    const swiftInterfacePath = path.join(
      frameworkPath,
      'Modules',
      `${FRAMEWORK_NAME}.swiftmodule`,
      'arm64-apple-ios.swiftinterface'
    );
    await fs.outputFile(swiftInterfacePath, interfaceContents);

    return { frameworkPath, swiftInterfacePath };
  }

  const CLEAN_INTERFACE = [
    '// swift-interface-format-version: 1.0',
    '@_exported import ExpoModulesCore',
    'import Swift',
    'public var registry: ExpoModulesCore::EXModuleRegistry',
  ].join('\n');

  it('reports an issue for a qualified reference to an internal target', async () => {
    const { frameworkPath, swiftInterfacePath } = await createFrameworkFixtureAsync(
      [
        '// swift-interface-format-version: 1.0',
        '@_exported import ExpoModulesCore',
        'public var registry: ExpoModulesCore_ios_objc::EXModuleRegistry',
        'public var appContext: ExpoModulesCore_ios_objc::EXAppContext',
      ].join('\n')
    );

    const issues = await verifySwiftInterfaceImports(swiftInterfacePath, frameworkPath);

    assert.equal(issues.length, 1);
    assert.match(
      issues[0],
      /arm64-apple-ios\.swiftinterface: 2 references to 'ExpoModulesCore_ios_objc'/
    );
    assert.match(issues[0], /is not imported through module/);
  });

  it('reports no issue for an interface that only names product modules', async () => {
    const { frameworkPath, swiftInterfacePath } =
      await createFrameworkFixtureAsync(CLEAN_INTERFACE);

    assert.deepEqual(await verifySwiftInterfaceImports(swiftInterfacePath, frameworkPath), []);
  });
});
