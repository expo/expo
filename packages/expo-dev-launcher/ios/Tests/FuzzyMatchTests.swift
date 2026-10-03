// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class FuzzyMatchTests: XCTestCase {
  func testMatchesContiguousSubstrings() {
    XCTAssertTrue(fuzzyMatch("feat", in: "feature/search"))
    XCTAssertTrue(fuzzyMatch("search", in: "feature/search"))
  }

  func testMatchesAreCaseInsensitive() {
    XCTAssertTrue(fuzzyMatch("MAIN", in: "main"))
    XCTAssertTrue(fuzzyMatch("main", in: "MAIN"))
  }

  func testEmptyQueryMatchesEverything() {
    XCTAssertTrue(fuzzyMatch("", in: "anything"))
    XCTAssertTrue(fuzzyMatch("", in: ""))
  }

  func testMatchesNonContiguousCharactersInOrder() {
    XCTAssertTrue(fuzzyMatch("fs", in: "feature/search"))
    XCTAssertTrue(fuzzyMatch("ftsh", in: "feature/search"))
  }

  func testMatchesBroadlyAcrossUnrelatedBranchNames() {
    XCTAssertTrue(fuzzyMatch("ee", in: "feature/search"))
    XCTAssertTrue(fuzzyMatch("ee", in: "release/hotfix"))
    XCTAssertTrue(fuzzyMatch("ee", in: "develop"))
    XCTAssertTrue(fuzzyMatch("fresh", in: "feature/search"))
    XCTAssertTrue(fuzzyMatch("sea", in: "feature/search"))
  }

  func testReturnsFalseWhenACharacterIsMissing() {
    XCTAssertFalse(fuzzyMatch("z", in: "feature/search"))
    XCTAssertFalse(fuzzyMatch("searchx", in: "feature/search"))
  }

  func testReturnsFalseWhenCharactersAreOutOfOrder() {
    XCTAssertFalse(fuzzyMatch("hs", in: "search"))
  }
}
