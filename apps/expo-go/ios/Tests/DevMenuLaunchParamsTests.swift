// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

@MainActor
final class DevMenuLaunchParamsTests: XCTestCase {
  /// Runs `body` with the three dev menu defaults reset, and restores the caller's values afterwards.
  private func withResetPreferences(_ body: () -> Void) {
    let saved = (
      DevMenuPreferences.showsAtLaunch,
      DevMenuPreferences.isOnboardingFinished,
      DevMenuPreferences.showFloatingActionButton
    )
    defer {
      DevMenuPreferences.showsAtLaunch = saved.0
      DevMenuPreferences.isOnboardingFinished = saved.1
      DevMenuPreferences.showFloatingActionButton = saved.2
    }
    DevMenuPreferences.showsAtLaunch = true
    DevMenuPreferences.isOnboardingFinished = false
    DevMenuPreferences.showFloatingActionButton = true
    body()
  }

  private func apply(_ string: String) -> URL {
    return DevMenuManager.shared.applyLaunchParams(from: URL(string: string)!)
  }

  func testDisableFabHidesTheFabOnly() {
    withResetPreferences {
      let result = apply("exp://h:8081/?__expo_disable_fab=1&x=1")

      XCTAssertFalse(DevMenuPreferences.showFloatingActionButton)
      XCTAssertTrue(DevMenuPreferences.showsAtLaunch)
      XCTAssertFalse(DevMenuPreferences.isOnboardingFinished)
      XCTAssertEqual(result.absoluteString, "exp://h:8081/?x=1")
    }
  }

  func testDisableAutoLaunchTurnsOffTheLaunchMenuAndFinishesOnboarding() {
    withResetPreferences {
      let result = apply("exp://h:8081/?__expo_disable_auto_launch=1")

      XCTAssertFalse(DevMenuPreferences.showsAtLaunch)
      XCTAssertTrue(DevMenuPreferences.isOnboardingFinished)
      XCTAssertTrue(DevMenuPreferences.showFloatingActionButton)
      XCTAssertEqual(result.absoluteString, "exp://h:8081/")
    }
  }

  func testDisableOnboardingFinishesOnboardingOnly() {
    withResetPreferences {
      _ = apply("exp://h:8081/?__expo_disable_onboarding=1")

      XCTAssertTrue(DevMenuPreferences.isOnboardingFinished)
      XCTAssertTrue(DevMenuPreferences.showsAtLaunch)
      XCTAssertTrue(DevMenuPreferences.showFloatingActionButton)
    }
  }

  func testReturnsTheTargetWhenPresent() {
    withResetPreferences {
      let result = apply("exp://?__expo_url=http%3A%2F%2F10.0.0.5%3A8081&__expo_disable_fab=1")

      XCTAssertEqual(result.absoluteString, "http://10.0.0.5:8081")
      XCTAssertFalse(DevMenuPreferences.showFloatingActionButton)
    }
  }

  func testPlainURLIsReturnedUnchangedAndWritesNothing() {
    withResetPreferences {
      let result = apply("exp://h:8081/?x=1")

      XCTAssertEqual(result.absoluteString, "exp://h:8081/?x=1")
      XCTAssertTrue(DevMenuPreferences.showsAtLaunch)
      XCTAssertFalse(DevMenuPreferences.isOnboardingFinished)
      XCTAssertTrue(DevMenuPreferences.showFloatingActionButton)
    }
  }
}
