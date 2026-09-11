// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SourceTreeTests: XCTestCase {
  private func build(_ paths: [String], unwrapSingleRoot: Bool = false) -> SourceTree {
    SourceTreeBuilder.build(
      sources: paths.map { ($0, "// \($0)") },
      unwrapSingleRoot: unwrapSingleRoot
    )
  }

  func testBuildsHierarchyWithDirectoriesFirstSorted() {
    let tree = build(["src/b.ts", "src/a.ts", "src/nested/c.ts"])
    let src = tree.rootNodes.first { $0.name == "src" }
    XCTAssertNotNil(src)
    XCTAssertEqual(src?.children.map(\.name), ["nested", "a.ts", "b.ts"])
  }

  func testNodeModulesHoistedIntoModulesFolder() {
    // Two packages so the modules folder keeps multiple children and the
    // single-child collapse doesn't merge it away.
    let tree = build(["node_modules/react/index.js", "node_modules/expo/index.js", "App.js"])
    let dotdot = tree.rootNodes.first { $0.name == ".." }
    XCTAssertNotNil(dotdot)
    XCTAssertEqual(dotdot?.children.first?.name, "modules")
    XCTAssertEqual(dotdot?.children.first?.children.map(\.name), ["expo", "react"])
  }

  func testNestedNodeModulesDoNotCreateDuplicateHoists() {
    // Regression: a/node_modules/b/node_modules/c used to create ../modules
    // pairs at multiple depths.
    let tree = build(["a/node_modules/b/node_modules/c/index.js"])
    var dotdotCount = 0
    func countDotDot(_ nodes: [FileTreeNode]) {
      for node in nodes {
        if node.name == ".." { dotdotCount += 1 }
        countDotDot(node.children)
      }
    }
    countDotDot(tree.rootNodes)
    XCTAssertEqual(dotdotCount, 1)
  }

  func testSkipsCtxVirtualModules() {
    let tree = build(["src/app?ctx=abc123", "src/real.ts"])
    XCTAssertEqual(tree.flatFiles.count, 1)
    XCTAssertEqual(tree.flatFiles.first?.name, "real.ts")
  }

  func testCollapsesSingleChildFolderChains() {
    let tree = build(["deep/nested/chain/only.ts", "top.ts"])
    let dir = tree.rootNodes.first { $0.isDirectory }
    XCTAssertEqual(dir?.name, "chain")
    XCTAssertEqual(dir?.children.first?.name, "only.ts")
  }

  func testUnwrapSingleRootDirectory() {
    let wrapped = build(["project/src/a.ts", "project/b.ts"], unwrapSingleRoot: false)
    XCTAssertEqual(wrapped.rootNodes.count, 1)

    let unwrapped = build(["project/src/a.ts", "project/b.ts"], unwrapSingleRoot: true)
    XCTAssertTrue(unwrapped.rootNodes.contains { $0.name == "b.ts" })
  }

  func testFlatIndexAndContentLookup() {
    let tree = SourceTreeBuilder.build(
      sources: [("src/a.ts", "contents-a"), ("src/b.ts", nil)],
      unwrapSingleRoot: false
    )
    XCTAssertEqual(tree.flatFiles.count, 2)
    XCTAssertEqual(tree.contents(forPath: "src/a.ts"), "contents-a")
    XCTAssertNil(tree.contents(forPath: "src/b.ts"))
    XCTAssertNil(tree.contents(forPath: "missing"))
  }

  func testContentLookupUsesDisplayPathAfterNodeModulesRewrite() {
    let tree = SourceTreeBuilder.build(
      sources: [("node_modules/react/index.js", "react code"), ("node_modules/expo/index.js", "expo code")],
      unwrapSingleRoot: false
    )
    // Nodes carry the rewritten path; contents must be keyed the same way.
    let modulesDir = tree.rootNodes.first { $0.name == ".." }?.children.first
    let react = modulesDir?.children.first { $0.name == "react" }
    let leaf = react?.children.first
    XCTAssertNotNil(leaf)
    XCTAssertEqual(tree.contents(forPath: leaf!.path), "react code")
  }
}
