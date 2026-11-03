// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class HomeTabTests: XCTestCase {
  func testTitles() {
    XCTAssertEqual(HomeTab.home.title, "Home")
    XCTAssertEqual(HomeTab.learn.title, "Learn")
    XCTAssertEqual(HomeTab.diagnostics.title, "Diagnostics")
    XCTAssertEqual(HomeTab.settings.title, "Settings")
  }

  func testSystemImages() {
    XCTAssertEqual(HomeTab.home.systemImage, "house.fill")
    XCTAssertEqual(HomeTab.learn.systemImage, "book.fill")
    XCTAssertEqual(HomeTab.diagnostics.systemImage, "stethoscope")
    XCTAssertEqual(HomeTab.settings.systemImage, "gearshape")
  }
}
