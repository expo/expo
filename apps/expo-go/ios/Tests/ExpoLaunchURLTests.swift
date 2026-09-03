// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import Expo_Go

class ExpoLaunchURLTests: XCTestCase {
  private func launch(_ string: String) -> ExpoLaunchURL {
    return ExpoLaunchURL(URL(string: string)!)
  }

  func testLegacyHostWithUrlAndDisableOnboarding() {
    let raw = "exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081&disableOnboarding=1"
    let launch = launch(raw)

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertTrue(launch.isLegacyHost)
    XCTAssertEqual(launch.targetURL, URL(string: "http://10.0.0.5:8081"))
    XCTAssertTrue(launch.disablesOnboarding)
    XCTAssertNil(launch.launchToken)
    XCTAssertFalse(launch.suppressesMenuAtLaunch)
    XCTAssertFalse(launch.hidesToolsButton)
    // The legacy `url=` form is kept intact so apps and expo-router keep working.
    XCTAssertEqual(launch.strippedURL.absoluteString, raw)
  }

  func testNewShapeWithEveryReservedParam() {
    let launch = launch(
      "exp+slug://?__expo_url=http%3A%2F%2F10.0.0.5%3A8081&__expo_launch_token=abc" +
        "&__expo_show_menu_at_launch=0&__expo_tools_button=0&__expo_disable_onboarding=1"
    )

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertFalse(launch.isLegacyHost)
    XCTAssertEqual(launch.targetURL, URL(string: "http://10.0.0.5:8081"))
    XCTAssertEqual(launch.launchToken, "abc")
    XCTAssertTrue(launch.suppressesMenuAtLaunch)
    XCTAssertTrue(launch.hidesToolsButton)
    XCTAssertTrue(launch.disablesOnboarding)
    XCTAssertFalse(launch.remainderHasDestination)
    XCTAssertNil(launch.strippedURL.query)
    XCTAssertTrue(launch.passthroughParams.isEmpty)
  }

  func testAppDeepLinkCarryingAReservedParam() {
    let launch = launch("myapp://login?__expo_launch_token=abc&x=1")

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertNil(launch.targetURL)
    XCTAssertEqual(launch.launchToken, "abc")
    XCTAssertTrue(launch.remainderHasDestination)
    XCTAssertEqual(launch.strippedURL.absoluteString, "myapp://login?x=1")
    XCTAssertEqual(launch.passthroughParams, ["x": "1"])
  }

  func testNewShapeWithoutADestination() {
    let launch = launch("myapp://?__expo_url=http%3A%2F%2Flocalhost%3A8081")

    XCTAssertEqual(launch.targetURL, URL(string: "http://localhost:8081"))
    XCTAssertFalse(launch.remainderHasDestination)
  }

  func testPlainAppDeepLinkIsNotALauncherCommand() {
    let raw = "myapp://login?x=1"
    let launch = launch(raw)

    XCTAssertFalse(launch.isLauncherCommand)
    XCTAssertNil(launch.targetURL)
    XCTAssertEqual(launch.strippedURL.absoluteString, raw)
    XCTAssertEqual(launch.passthroughParams, ["x": "1"])
  }

  func testExpoGoUrlKeepsTheOtherParams() {
    let launch = launch("exp://h:8081/--/p?__expo_tools_button=0&x=1")

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertTrue(launch.hidesToolsButton)
    XCTAssertNil(launch.targetURL)
    XCTAssertTrue(launch.remainderHasDestination)
    XCTAssertEqual(launch.strippedURL.absoluteString, "exp://h:8081/--/p?x=1")
  }

  func testParamsInsideTheTargetUrlAreIgnored() {
    let launch = launch("exp+slug://?__expo_url=http%3A%2F%2Flocalhost%3A8081%2F%3F__expo_tools_button%3D0")

    XCTAssertFalse(launch.hidesToolsButton)
    XCTAssertEqual(launch.targetURL, URL(string: "http://localhost:8081/?__expo_tools_button=0"))
  }

  func testOnlyExactValuesAct() {
    let launch = launch("exp://h:8081?__expo_show_menu_at_launch=1&__expo_tools_button=false&__expo_disable_onboarding=true")

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertFalse(launch.suppressesMenuAtLaunch)
    XCTAssertFalse(launch.hidesToolsButton)
    XCTAssertFalse(launch.disablesOnboarding)
    XCTAssertNil(launch.strippedURL.query)
  }

  func testUnknownReservedParamsAreStripped() {
    let launch = launch("exp://h:8081?__expo_foo=1&x=1")

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertEqual(launch.strippedURL.absoluteString, "exp://h:8081?x=1")
  }

  func testLegacyAliasesOnlyApplyOnTheLegacyHost() {
    let raw = "exp://h:8081?disableOnboarding=1&url=http%3A%2F%2Fother"
    let launch = launch(raw)

    XCTAssertFalse(launch.isLauncherCommand)
    XCTAssertFalse(launch.disablesOnboarding)
    XCTAssertNil(launch.targetURL)
    XCTAssertEqual(launch.strippedURL.absoluteString, raw)
  }

  func testOpaqueUrlDoesNotThrow() {
    let launch = launch("mailto:a@b.c")

    XCTAssertFalse(launch.isLauncherCommand)
    XCTAssertNil(launch.targetURL)
    XCTAssertEqual(launch.strippedURL.absoluteString, "mailto:a@b.c")
  }

  func testPreservesPercentEncodingOfTheOtherParams() {
    let launch = launch("exp://h:8081/?snack-channel=a%2Bb&__expo_tools_button=0")

    XCTAssertEqual(launch.strippedURL.absoluteString, "exp://h:8081/?snack-channel=a%2Bb")
  }

  func testEmptyLaunchTokenIsNil() {
    let launch = launch("exp://h:8081?__expo_launch_token=")

    XCTAssertNil(launch.launchToken)
  }
}
