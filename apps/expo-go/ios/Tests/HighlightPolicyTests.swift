// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class HighlightPolicyTests: XCTestCase {
  func testHighlightsNormalFile() {
    XCTAssertTrue(HighlightPolicy.shouldHighlight("const x = 1;\nfunction y() {}\n"))
  }

  func testSkipsVeryLargeFile() {
    let big = String(repeating: "const a = 1;\n", count: 20_000)  // >200KB
    XCTAssertFalse(HighlightPolicy.shouldHighlight(big))
  }

  func testSkipsMinifiedSingleLongLine() {
    let minified = String(repeating: "a=1;", count: 2_000)  // one ~8KB line
    XCTAssertFalse(HighlightPolicy.shouldHighlight(minified))
  }

  func testHighlightsEmpty() {
    XCTAssertTrue(HighlightPolicy.shouldHighlight(""))
  }
}
