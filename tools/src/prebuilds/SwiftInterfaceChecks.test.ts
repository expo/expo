import fs from 'fs-extra';
import assert from 'node:assert/strict';
import os from 'node:os';
import { describe, it } from 'node:test';
import path from 'path';

import { findTestOnlyImports, verifyNoTestOnlyImports } from './SwiftInterfaceChecks';

async function createFrameworkFixture(interfaces: Record<string, string>): Promise<string> {
  const frameworkPath = await fs.mkdtemp(path.join(os.tmpdir(), 'swiftinterface-checks-'));
  for (const [relativePath, contents] of Object.entries(interfaces)) {
    await fs.outputFile(path.join(frameworkPath, relativePath), contents);
  }
  return frameworkPath;
}

describe('findTestOnlyImports', () => {
  it('reports every test-only module imported by the interface', () => {
    const contents = [
      '// swift-interface-format-version: 1.0',
      'import AVFoundation',
      'import Foundation',
      'import Testing',
      '@_exported import ExpoCamera',
      'import UIKit',
      'import _Testing_CoreGraphics',
      'import _Testing_Foundation',
      'import _Testing_UIKit',
      'import _Concurrency',
    ].join('\n');

    assert.deepEqual(findTestOnlyImports(contents), [
      'Testing',
      '_Testing_CoreGraphics',
      '_Testing_Foundation',
      '_Testing_UIKit',
    ]);
  });

  it('reports indented and @testable imports', () => {
    assert.deepEqual(findTestOnlyImports('  @testable import Testing\n'), ['Testing']);
  });

  it('reports imports carrying attributes or an access modifier', () => {
    const contents = [
      '@_exported @preconcurrency import Testing',
      '@_implementationOnly import _Testing_Foundation',
      'public import Testing',
      '@_spi(Experimental) import Testing',
    ].join('\n');

    assert.deepEqual(findTestOnlyImports(contents), ['Testing', '_Testing_Foundation']);
  });

  it('returns nothing for an interface without test imports', () => {
    const contents = ['import Foundation', '@_exported @preconcurrency import UIKit'].join('\n');
    assert.deepEqual(findTestOnlyImports(contents), []);
  });

  it('does not match modules that merely start with Testing', () => {
    assert.deepEqual(findTestOnlyImports('import TestingUtils\n'), []);
  });

  it('does not match imports inside comments', () => {
    assert.deepEqual(findTestOnlyImports('// import Testing\n'), []);
  });
});

describe('verifyNoTestOnlyImports', () => {
  it('fails and names the interface and its test-only modules', async () => {
    const frameworkPath = await createFrameworkFixture({
      'Modules/Foo.swiftmodule/arm64-apple-ios.private.swiftinterface': [
        'import Foundation',
        'import Testing',
        'import _Testing_UIKit',
      ].join('\n'),
    });
    try {
      const result = verifyNoTestOnlyImports(frameworkPath);

      assert.equal(result.success, false);
      assert.match(result.message, /arm64-apple-ios\.private\.swiftinterface/);
      assert.match(result.message, /Testing/);
      assert.match(result.message, /_Testing_UIKit/);
      assert.ok(result.details, 'a failure must explain how to fix it');
    } finally {
      await fs.remove(frameworkPath);
    }
  });

  it('succeeds for an interface without test-only imports', async () => {
    const frameworkPath = await createFrameworkFixture({
      'Modules/Foo.swiftmodule/arm64-apple-ios.swiftinterface': 'import Foundation\n',
    });
    try {
      assert.deepEqual(verifyNoTestOnlyImports(frameworkPath), {
        success: true,
        message: 'No test-only imports',
      });
    } finally {
      await fs.remove(frameworkPath);
    }
  });

  it('succeeds for an ObjC-only framework without a Modules directory', async () => {
    const frameworkPath = await createFrameworkFixture({ 'Headers/Foo.h': '' });
    try {
      assert.equal(verifyNoTestOnlyImports(frameworkPath).success, true);
    } finally {
      await fs.remove(frameworkPath);
    }
  });
});
