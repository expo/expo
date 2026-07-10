// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class BundleSourceMapProviderTests: XCTestCase {
  func testHermesBytecodeBundleThrowsClearError() {
    // Hermes bytecode magic: c6 1f bc 03
    var bytes: [UInt8] = [0xc6, 0x1f, 0xbc, 0x03]
    bytes.append(contentsOf: Array(repeating: 0x00, count: 64))
    do {
      _ = try BundleSourceMapProvider.extractInlineSourceMap(from: Data(bytes))
      XCTFail("expected error")
    } catch let error as SourceMapError {
      guard case .hermesBytecodeBundle = error else {
        return XCTFail("expected .hermesBytecodeBundle, got \(error)")
      }
    } catch {
      XCTFail("wrong error type: \(error)")
    }
  }

  func testPlainBundleWithoutMarkerThrowsNoSourceMapFound() {
    let bundle = Data("console.log('hi');\n".utf8)
    do {
      _ = try BundleSourceMapProvider.extractInlineSourceMap(from: bundle)
      XCTFail("expected error")
    } catch let error as SourceMapError {
      guard case .noSourceMapFound = error else {
        return XCTFail("expected .noSourceMapFound, got \(error)")
      }
    } catch {
      XCTFail("wrong error type: \(error)")
    }
  }
}
