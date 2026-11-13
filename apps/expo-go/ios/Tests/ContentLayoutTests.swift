// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ContentLayoutTests: XCTestCase {
  func testNarrowWindowUsesFullWidth() {
    XCTAssertEqual(ContentLayout.contentWidth(for: 466), 466)
  }

  func testWideWindowIsCappedAt600() {
    XCTAssertEqual(ContentLayout.contentWidth(for: 951), 600)
  }

  func testExactly600IsUnchanged() {
    XCTAssertEqual(ContentLayout.contentWidth(for: 600), 600)
  }
}
