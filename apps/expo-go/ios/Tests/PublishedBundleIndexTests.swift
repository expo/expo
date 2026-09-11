// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class PublishedBundleIndexTests: XCTestCase {
  // 7 lines: prelude, single-line module 0, multi-line module 1 (template
  // literal), its continuation, module 2 with DUPLICATE dep ids, a trailing
  // __r bootstrap line, and the sourcemap comment.
  private static let bundleText = """
    var __DEV__=false;
    __d(function(g,r,i,a,m,e,d){e.default=r(d[0]);},0,[1,2]);
    __d(function(g,r,i,a,m,e,d){var t=`multi
    line`;e.default=t;},1,[]);
    __d(function(g,r,i,a,m,e,d){e.a=r(d[0]);e.b=r(d[1]);},2,[1,1]);
    __r(0);
    //# sourceMappingURL=data:application/json;charset=utf-8;base64,e30=
    """

  private static let map = SourceMapDTO(
    version: 3,
    sources: ["/app/App.tsx", "/app/multi.ts", "/app/dup.ts"],
    sourcesContent: nil,
    mappings: ";AAAA;ACAA;;ACAA;;",
    names: []
  )

  private func buildIndex() throws -> PublishedBundleIndex {
    try PublishedBundleIndex.build(bundle: Data(Self.bundleText.utf8), map: Self.map)
  }

  func testParsesAllThreeModules() throws {
    let index = try buildIndex()
    XCTAssertEqual(index.modules.count, 3)
    XCTAssertEqual(index.modules[0]?.dependencyIds, [1, 2])
    XCTAssertEqual(index.modules[1]?.dependencyIds, [])
  }

  func testDuplicateDependencyIdsArePreserved() throws {
    let index = try buildIndex()
    XCTAssertEqual(index.modules[2]?.dependencyIds, [1, 1])
  }

  func testSourcemapWalkMapsModulesToSources() throws {
    let index = try buildIndex()
    XCTAssertEqual(index.sourcePathByModuleId[0], "/app/App.tsx")
    XCTAssertEqual(index.sourcePathByModuleId[1], "/app/multi.ts")
    XCTAssertEqual(index.sourcePathByModuleId[2], "/app/dup.ts")
    XCTAssertEqual(index.moduleIdByDisplayPath["app/App.tsx"], 0)
    XCTAssertEqual(index.moduleIdByDisplayPath["app/dup.ts"], 2)
  }

  func testEmptyBundleThrows() {
    XCTAssertThrowsError(
      try PublishedBundleIndex.build(bundle: Data("var x=1;\n".utf8), map: Self.map)
    )
  }
}
