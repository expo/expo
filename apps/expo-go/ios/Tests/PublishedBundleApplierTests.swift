// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

private struct FakeTransformer: ModuleTransforming {
  var result: (String, String, Int, [Int]) throws -> ModuleTransformResult
  func transform(source: String, filename: String, moduleId: Int, dependencyIds: [Int]) throws -> ModuleTransformResult {
    try result(source, filename, moduleId, dependencyIds)
  }
}

final class PublishedBundleApplierTests: XCTestCase {
  // Reuses the Task 1 fixture shape: module 0 is /app/App.tsx with deps [1,2].
  private static let bundleText = """
    var __DEV__=false;
    __d(function(g,r,i,a,m,e,d){e.default=r(d[0]);},0,[1,2]);
    __d(function(g,r,i,a,m,e,d){e.default=1;},1,[]);
    __d(function(g,r,i,a,m,e,d){e.default=2;},2,[]);
    __r(0);
    //# sourceMappingURL=data:application/json;charset=utf-8;base64,\(inlineMapBase64)
    """

  private static let inlineMapBase64: String = {
    let map: [String: Any] = [
      "version": 3,
      "sources": ["/app/App.tsx", "/app/a.ts", "/app/b.ts"],
      "mappings": ";AAAA;ACAA;ACAA;;",
      "names": [],
    ]
    let data = try! JSONSerialization.data(withJSONObject: map)
    return data.base64EncodedString()
  }()

  override func tearDown() {
    PatchedBundleRegistry.clear()
    super.tearDown()
  }

  func testApplyWritesPatchedBundleAndRegisters() throws {
    let transformer = FakeTransformer { _, _, _, _ in
      ModuleTransformResult(
        moduleCode: "exports.default = require('./a');",
        dependencyNames: ["./a", "./b"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)

    let url = try applier.apply(
      edits: [.init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")],
      scopeKey: "test-scope")

    XCTAssertEqual(PatchedBundleRegistry.patchedBundleURL(forScopeKey: "test-scope"), url)
    let patched = try String(contentsOf: url, encoding: .utf8)
    XCTAssertTrue(patched.hasPrefix(BundlePatch.startMarker))
    XCTAssertTrue(patched.contains("overrides[0] ="))
    XCTAssertTrue(patched.contains("exports.default = require('./a');"))
    // original bundle intact after the patch block
    XCTAssertTrue(patched.hasSuffix(Self.bundleText))
  }

  func testUnknownPathThrowsModuleNotFound() throws {
    let transformer = FakeTransformer { _, _, _, _ in
      ModuleTransformResult(moduleCode: "", dependencyNames: [])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    XCTAssertThrowsError(try applier.apply(
      edits: [.init(displayPath: "app/Missing.tsx", contents: "x", originalContents: "x")],
      scopeKey: "test-scope"))
  }

  func testAddedImportIsRefusedWithPreciseError() throws {
    let transformer = FakeTransformer { source, _, _, _ in
      source == "orig"
        ? ModuleTransformResult(moduleCode: "o", dependencyNames: ["./a", "./b"])
        : ModuleTransformResult(moduleCode: "e", dependencyNames: ["./a", "./b", "expo-crypto"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    XCTAssertThrowsError(try applier.apply(
      edits: [.init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")],
      scopeKey: "test-scope")
    ) { error in
      guard case .importsChanged(_, let added, let removed) = error as? PublishedBundleApplier.ApplyError else {
        return XCTFail("expected .importsChanged, got \(error)")
      }
      XCTAssertEqual(added, ["expo-crypto"])
      XCTAssertEqual(removed, [])
    }
    XCTAssertNil(PatchedBundleRegistry.patchedBundleURL(forScopeKey: "test-scope"))
  }

  func testUnverifiablePristineIsRefused() throws {
    // pristine transform emits a name that doesn't match any dep
    let transformer = FakeTransformer { _, _, _, _ in
      ModuleTransformResult(moduleCode: "o", dependencyNames: ["some-phantom-pkg", "./b"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    XCTAssertThrowsError(try applier.apply(
      edits: [.init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")],
      scopeKey: "test-scope")
    ) { error in
      guard case .cannotVerify = error as? PublishedBundleApplier.ApplyError else {
        return XCTFail("expected .cannotVerify, got \(error)")
      }
    }
  }

  func testReimportOfExistingDepIsAllowed() throws {
    // edited adds a DUPLICATE of an existing name set - same names, legal
    let transformer = FakeTransformer { source, _, _, _ in
      ModuleTransformResult(
        moduleCode: source == "orig" ? "o" : "e",
        dependencyNames: ["./a", "./b"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    XCTAssertNoThrow(try applier.apply(
      edits: [.init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")],
      scopeKey: "test-scope"))
  }
}
