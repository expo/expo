// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class PatchedBundleRegistryTests: XCTestCase {
  override func tearDown() {
    PatchedBundleRegistry.clear()
    super.tearDown()
  }

  func testStoresAndReadsInterceptorPerScopeKey() {
    let interceptor = Data("//<patch>\n".utf8)
    PatchedBundleRegistry.setInterceptor(interceptor, forScopeKey: "scope")

    XCTAssertEqual(PatchedBundleRegistry.interceptor(forScopeKey: "scope"), interceptor)
    XCTAssertNil(PatchedBundleRegistry.interceptor(forScopeKey: "other"))
  }

  func testReplacingReturnsLatestInterceptor() {
    PatchedBundleRegistry.setInterceptor(Data("first".utf8), forScopeKey: "scope")
    PatchedBundleRegistry.setInterceptor(Data("second".utf8), forScopeKey: "scope")

    XCTAssertEqual(PatchedBundleRegistry.interceptor(forScopeKey: "scope"), Data("second".utf8))
  }

  func testClearRemovesEntries() {
    PatchedBundleRegistry.setInterceptor(Data("x".utf8), forScopeKey: "scope")
    PatchedBundleRegistry.clear()
    XCTAssertNil(PatchedBundleRegistry.interceptor(forScopeKey: "scope"))
  }
}
