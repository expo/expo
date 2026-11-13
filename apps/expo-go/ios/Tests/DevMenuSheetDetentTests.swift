// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class DevMenuSheetDetentTests: XCTestCase {
  func testWithoutOnboardingUsesDefaultFraction() {
    XCTAssertEqual(DevMenuSheetDetent.height(maximum: 800, onboardingHeight: nil), 480)
  }

  func testOnboardingTallerThanDefaultGrowsToFit() {
    XCTAssertEqual(DevMenuSheetDetent.height(maximum: 620, onboardingHeight: 500), 500)
  }

  func testOnboardingShorterThanDefaultKeepsDefault() {
    XCTAssertEqual(DevMenuSheetDetent.height(maximum: 800, onboardingHeight: 300), 480)
  }

  func testOnboardingTallerThanMaximumIsClamped() {
    XCTAssertEqual(DevMenuSheetDetent.height(maximum: 620, onboardingHeight: 900), 620)
  }
}
