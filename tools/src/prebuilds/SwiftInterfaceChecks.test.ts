import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findTestOnlyImports } from './SwiftInterfaceChecks';

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
