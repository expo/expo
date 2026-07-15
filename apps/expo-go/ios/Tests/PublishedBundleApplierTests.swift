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

  func testPrepareBuildsInterceptorWithoutRegistering() throws {
    let transformer = FakeTransformer { _, _, _, _ in
      ModuleTransformResult(
        moduleCode: "exports.default = require('./a');",
        dependencyNames: ["./a", "./b"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)

    let result = applier.prepare(
      edits: [.init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")])

    XCTAssertTrue(result.failures.isEmpty)
    XCTAssertNil(PatchedBundleRegistry.interceptor(forScopeKey: "test-scope"))
    XCTAssertTrue(result.interceptor.hasPrefix(BundlePatch.startMarker))
    XCTAssertTrue(result.interceptor.contains("overrides[0] ="))
    XCTAssertTrue(result.interceptor.contains("exports.default = require('./a');"))
  }

  func testUnknownPathReportedAsFailure() throws {
    let transformer = FakeTransformer { _, _, _, _ in
      ModuleTransformResult(moduleCode: "", dependencyNames: [])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    let result = applier.prepare(
      edits: [.init(displayPath: "app/Missing.tsx", contents: "x", originalContents: "x")])
    XCTAssertEqual(result.failures.count, 1)
    guard case .moduleNotFound = result.failures.first?.error as? PublishedBundleApplier.ApplyError else {
      return XCTFail("expected .moduleNotFound, got \(String(describing: result.failures.first?.error))")
    }
  }

  func testAddedImportReportedAsFailureWithPreciseError() throws {
    let transformer = FakeTransformer { source, _, _, _ in
      source == "orig"
        ? ModuleTransformResult(moduleCode: "o", dependencyNames: ["./a", "./b"])
        : ModuleTransformResult(moduleCode: "e", dependencyNames: ["./a", "./b", "expo-crypto"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    let result = applier.prepare(
      edits: [.init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")])
    guard case .importsChanged(_, let added, let removed) = result.failures.first?.error as? PublishedBundleApplier.ApplyError else {
      return XCTFail("expected .importsChanged, got \(String(describing: result.failures.first?.error))")
    }
    XCTAssertEqual(added, ["expo-crypto"])
    XCTAssertEqual(removed, [])
  }

  func testUnverifiablePristineReportedAsFailure() throws {
    // pristine transform emits a name that doesn't match any dep
    let transformer = FakeTransformer { _, _, _, _ in
      ModuleTransformResult(moduleCode: "o", dependencyNames: ["some-phantom-pkg", "./b"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    let result = applier.prepare(
      edits: [.init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")])
    guard case .cannotVerify = result.failures.first?.error as? PublishedBundleApplier.ApplyError else {
      return XCTFail("expected .cannotVerify, got \(String(describing: result.failures.first?.error))")
    }
  }

  func testOneUnappliableEditDoesNotDropTheOthers() throws {
    let transformer = FakeTransformer { _, _, _, _ in
      ModuleTransformResult(moduleCode: "require('./a'); require('./b');", dependencyNames: ["./a", "./b"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    let result = applier.prepare(edits: [
      .init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig"),
      .init(displayPath: "app/Missing.tsx", contents: "x", originalContents: "y"),
    ])

    XCTAssertTrue(result.interceptor.contains("overrides[0] ="), "the valid edit should still be applied")
    XCTAssertEqual(result.failures.map { $0.displayPath }, ["app/Missing.tsx"])
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
    let result = applier.prepare(
      edits: [.init(displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")])
    XCTAssertTrue(result.failures.isEmpty)
    XCTAssertTrue(result.interceptor.contains("overrides[0] ="))
  }

  func testFactoryCacheAvoidsRetransformingUnchangedEdits() throws {
    final class Counter { var count = 0 }
    let counter = Counter()
    let transformer = FakeTransformer { source, _, _, _ in
      counter.count += 1
      return ModuleTransformResult(
        moduleCode: "/* \(source) */ require('./a'); require('./b');",
        dependencyNames: ["./a", "./b"])
    }
    let applier = try PublishedBundleApplier(
      bundleData: Data(Self.bundleText.utf8), transformer: transformer)
    let edit = PublishedBundleApplier.SourceEdit(
      displayPath: "app/App.tsx", contents: "edited", originalContents: "orig")

    _ = applier.prepare(edits: [edit])
    let afterFirst = counter.count
    XCTAssertGreaterThan(afterFirst, 0)

    _ = applier.prepare(edits: [edit])
    XCTAssertEqual(counter.count, afterFirst, "identical re-save should not re-transform")

    let changed = PublishedBundleApplier.SourceEdit(
      displayPath: "app/App.tsx", contents: "edited again", originalContents: "orig")
    _ = applier.prepare(edits: [changed])
    XCTAssertGreaterThan(counter.count, afterFirst, "changed contents should re-transform")
  }
}
