// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

@MainActor
final class DevMenuLaunchParamsTests: XCTestCase {
  /// Runs `body` with the dev menu defaults and the one-time switches reset, then restores the caller's values.
  private func withResetState(_ body: () -> Void) {
    let manager = DevMenuManager.shared
    let saved = (
      DevMenuPreferences.showsAtLaunch,
      DevMenuPreferences.isOnboardingFinished,
      DevMenuPreferences.showFloatingActionButton,
      manager.canLaunchDevMenuOnStart,
      manager.canShowFloatingActionButton
    )
    defer {
      DevMenuPreferences.showsAtLaunch = saved.0
      DevMenuPreferences.isOnboardingFinished = saved.1
      DevMenuPreferences.showFloatingActionButton = saved.2
      manager.canLaunchDevMenuOnStart = saved.3
      manager.canShowFloatingActionButton = saved.4
    }
    DevMenuPreferences.showsAtLaunch = true
    DevMenuPreferences.isOnboardingFinished = false
    DevMenuPreferences.showFloatingActionButton = true
    manager.canLaunchDevMenuOnStart = true
    manager.canShowFloatingActionButton = true
    body()
  }

  private func apply(_ string: String) -> URL {
    return DevMenuManager.shared.applyLaunchParams(from: URL(string: string)!)
  }

  func testDisableFabHidesTheFabForThisProcessOnly() {
    withResetState {
      let result = apply("exp://h:8081/?__expo_disable_fab=1&x=1")

      XCTAssertFalse(DevMenuManager.shared.canShowFloatingActionButton)
      XCTAssertTrue(DevMenuManager.shared.canLaunchDevMenuOnStart)
      XCTAssertTrue(DevMenuPreferences.showFloatingActionButton)
      XCTAssertTrue(DevMenuPreferences.showsAtLaunch)
      XCTAssertFalse(DevMenuPreferences.isOnboardingFinished)
      XCTAssertEqual(result.absoluteString, "exp://h:8081/?x=1")
    }
  }

  func testDisableAutoLaunchKeepsTheMenuClosedForThisProcessOnly() {
    withResetState {
      let result = apply("exp://h:8081/?__expo_disable_auto_launch=1")

      XCTAssertFalse(DevMenuManager.shared.canLaunchDevMenuOnStart)
      XCTAssertTrue(DevMenuManager.shared.canShowFloatingActionButton)
      XCTAssertTrue(DevMenuPreferences.showsAtLaunch)
      XCTAssertFalse(DevMenuPreferences.isOnboardingFinished)
      XCTAssertEqual(result.absoluteString, "exp://h:8081/")
    }
  }

  func testDisableOnboardingFinishesOnboardingInThePreferences() {
    withResetState {
      _ = apply("exp://h:8081/?__expo_disable_onboarding=1")

      XCTAssertTrue(DevMenuPreferences.isOnboardingFinished)
      XCTAssertTrue(DevMenuPreferences.showsAtLaunch)
      XCTAssertTrue(DevMenuPreferences.showFloatingActionButton)
      XCTAssertTrue(DevMenuManager.shared.canLaunchDevMenuOnStart)
      XCTAssertTrue(DevMenuManager.shared.canShowFloatingActionButton)
    }
  }

  func testReturnsTheTargetWhenPresent() {
    withResetState {
      let result = apply("exp://?__expo_url=http%3A%2F%2F10.0.0.5%3A8081&__expo_disable_fab=1")

      XCTAssertEqual(result.absoluteString, "http://10.0.0.5:8081")
      XCTAssertFalse(DevMenuManager.shared.canShowFloatingActionButton)
    }
  }

  func testResolveLaunchUrlNormalizesTheTargetAndLeavesItsOwnParamsAlone() {
    withResetState {
      let url = URL(string: "exp://?__expo_url=http%3A%2F%2F10.0.0.5%3A8081%2F%3F__expo_disable_fab%3D1&__expo_disable_auto_launch=1")!
      let resolved = EXKernelLinkingManager.resolveLaunchUrl(url)

      XCTAssertEqual(resolved.absoluteString, "exp://10.0.0.5:8081/?__expo_disable_fab=1")
      XCTAssertFalse(DevMenuManager.shared.canLaunchDevMenuOnStart)
      XCTAssertTrue(DevMenuManager.shared.canShowFloatingActionButton)
    }
  }

  func testResolveLaunchUrlReturnsAPlainURLAsIs() {
    withResetState {
      let url = URL(string: "http://10.0.0.5:8081/?x=1")!

      XCTAssertEqual(EXKernelLinkingManager.resolveLaunchUrl(url), url)
    }
  }

  func testPlainURLIsReturnedUnchangedAndChangesNothing() {
    withResetState {
      let result = apply("exp://h:8081/?x=1")

      XCTAssertEqual(result.absoluteString, "exp://h:8081/?x=1")
      XCTAssertTrue(DevMenuManager.shared.canLaunchDevMenuOnStart)
      XCTAssertTrue(DevMenuManager.shared.canShowFloatingActionButton)
      XCTAssertTrue(DevMenuPreferences.showsAtLaunch)
      XCTAssertFalse(DevMenuPreferences.isOnboardingFinished)
      XCTAssertTrue(DevMenuPreferences.showFloatingActionButton)
    }
  }
}
