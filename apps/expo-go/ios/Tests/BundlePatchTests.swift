// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class BundlePatchTests: XCTestCase {
  func testFactoryEmbedsMapAndCode() throws {
    let factory = try BundlePatch.factory(
      moduleCode: "exports.default = 42;",
      indexByName: ["react": 0, "./B": 1])
    XCTAssertTrue(factory.hasPrefix("function(g, r, i, a, m, e, d)"))
    XCTAssertTrue(factory.contains(#""react":0"#))
    XCTAssertTrue(factory.contains(#""./B":1"#))
    XCTAssertTrue(factory.contains("exports.default = 42;"))
  }

  func testInterceptorWrapsAllOverrides() {
    let interceptor = BundlePatch.interceptor(overrides: [
      (moduleId: 7, factory: "function(g,r,i,a,m,e,d){}"),
      (moduleId: 9, factory: "function(g,r,i,a,m,e,d){}"),
    ])
    XCTAssertTrue(interceptor.hasPrefix(BundlePatch.startMarker + "\n"))
    XCTAssertTrue(interceptor.contains("overrides[7] ="))
    XCTAssertTrue(interceptor.contains("overrides[9] ="))
    XCTAssertTrue(interceptor.contains("Object.defineProperty(global, '__d'"))
    XCTAssertTrue(interceptor.hasSuffix(BundlePatch.endMarker + "\n"))
  }

  func testStripRoundTrip() {
    let original = Data("__d(function(){},0,[]);\n".utf8)
    var patched = Data(BundlePatch.interceptor(overrides: []).utf8)
    patched.append(original)
    XCTAssertEqual(BundlePatch.strippingExistingPatch(from: patched), original)
  }

  func testStripLeavesUnpatchedBundleAlone() {
    let original = Data("__d(function(){},0,[]);\n".utf8)
    XCTAssertEqual(BundlePatch.strippingExistingPatch(from: original), original)
  }
}
