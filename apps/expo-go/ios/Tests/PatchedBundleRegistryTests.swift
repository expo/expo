// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class PatchedBundleRegistryTests: XCTestCase {
  override func tearDown() {
    PatchedBundleRegistry.clear()
    super.tearDown()
  }

  private func makeTempFile() throws -> URL {
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent("registry-test-\(UUID().uuidString).js")
    try Data("x".utf8).write(to: url)
    return url
  }

  func testReplacingAPatchDeletesTheSupersededFile() throws {
    let first = try makeTempFile()
    let second = try makeTempFile()
    PatchedBundleRegistry.setPatchedBundleURL(first, forScopeKey: "scope")
    PatchedBundleRegistry.setPatchedBundleURL(second, forScopeKey: "scope")
    XCTAssertFalse(FileManager.default.fileExists(atPath: first.path))
    XCTAssertTrue(FileManager.default.fileExists(atPath: second.path))
    XCTAssertEqual(PatchedBundleRegistry.patchedBundleURL(forScopeKey: "scope"), second)
  }

  func testClearDeletesFilesAndEntries() throws {
    let url = try makeTempFile()
    PatchedBundleRegistry.setPatchedBundleURL(url, forScopeKey: "scope")
    PatchedBundleRegistry.clear()
    XCTAssertFalse(FileManager.default.fileExists(atPath: url.path))
    XCTAssertNil(PatchedBundleRegistry.patchedBundleURL(forScopeKey: "scope"))
  }
}
