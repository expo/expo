// Copyright 2015-present 650 Industries. All rights reserved.

// XCTest mirror of packages/expo-dev-menu/ios/Tests/ExpoLauncherURLTests.swift for the Expo Go copy of the parser.

import XCTest

@testable import Expo_Go

class ExpoLauncherURLTests: XCTestCase {
  private func launch(_ string: String) -> ExpoLauncherURL {
    return ExpoLauncherURL(URL(string: string)!)
  }

  func testLegacyHostWithUrlOnly() {
    let raw = "exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081"
    let launch = launch(raw)

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertTrue(launch.isLegacyHost)
    XCTAssertEqual(launch.targetURL, URL(string: "http://10.0.0.5:8081"))
    XCTAssertFalse(launch.disablesOnboarding)
    XCTAssertFalse(launch.disablesFab)
    XCTAssertFalse(launch.disablesAutoLaunch)
    XCTAssertEqual(launch.strippedURL.absoluteString, raw)
    XCTAssertEqual(launch.passthroughParams, ["url": "http://10.0.0.5:8081"])
  }

  func testLegacyHostWithUrlAndDisableOnboarding() {
    let raw = "exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081&disableOnboarding=1"
    let launch = launch(raw)

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertEqual(launch.targetURL, URL(string: "http://10.0.0.5:8081"))
    XCTAssertTrue(launch.disablesOnboarding)
    XCTAssertFalse(launch.disablesFab)
    XCTAssertFalse(launch.disablesAutoLaunch)
    XCTAssertEqual(launch.strippedURL.absoluteString, raw)
  }

  func testLegacyDisableFabAndDisableAutoLaunchAreLeftToTheLauncher() {
    let launch = launch("exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081&disableFab=1&disableAutoLaunch=1")

    XCTAssertFalse(launch.disablesFab)
    XCTAssertFalse(launch.disablesAutoLaunch)
    XCTAssertEqual(launch.passthroughParams["disableFab"], "1")
  }

  func testNewShapeWithEveryReservedParam() {
    let launch = launch(
      "exp+slug://?__expo_url=http%3A%2F%2F10.0.0.5%3A8081" +
        "&__expo_disable_fab=1&__expo_disable_auto_launch=1&__expo_disable_onboarding=1"
    )

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertFalse(launch.isLegacyHost)
    XCTAssertEqual(launch.targetURL, URL(string: "http://10.0.0.5:8081"))
    XCTAssertTrue(launch.disablesFab)
    XCTAssertTrue(launch.disablesAutoLaunch)
    XCTAssertTrue(launch.disablesOnboarding)
    XCTAssertFalse(launch.remainderHasDestination)
    XCTAssertNil(launch.strippedURL.query)
    XCTAssertTrue(launch.passthroughParams.isEmpty)
  }

  func testAppDeepLinkCarryingAReservedParam() {
    let launch = launch("myapp://login?__expo_disable_fab=1&x=1")

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertNil(launch.targetURL)
    XCTAssertTrue(launch.disablesFab)
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
    let launch = launch("exp://h:8081/--/p?__expo_disable_fab=1&x=1")

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertTrue(launch.disablesFab)
    XCTAssertNil(launch.targetURL)
    XCTAssertTrue(launch.remainderHasDestination)
    XCTAssertEqual(launch.strippedURL.absoluteString, "exp://h:8081/--/p?x=1")
  }

  func testParamsInsideTheTargetUrlAreIgnored() {
    let launch = launch("exp+slug://?__expo_url=http%3A%2F%2Flocalhost%3A8081%2F%3F__expo_disable_fab%3D1")

    XCTAssertFalse(launch.disablesFab)
    XCTAssertEqual(launch.targetURL, URL(string: "http://localhost:8081/?__expo_disable_fab=1"))
  }

  func testOnlyExactValuesAct() {
    let launch = launch("exp://h:8081?__expo_disable_fab=0&__expo_disable_auto_launch=true&__expo_disable_onboarding=yes")

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertFalse(launch.disablesFab)
    XCTAssertFalse(launch.disablesAutoLaunch)
    XCTAssertFalse(launch.disablesOnboarding)
    XCTAssertNil(launch.strippedURL.query)
  }

  func testUnknownReservedParamsAreStripped() {
    let launch = launch("exp://h:8081?__expo_foo=1&x=1")

    XCTAssertTrue(launch.isLauncherCommand)
    XCTAssertEqual(launch.strippedURL.absoluteString, "exp://h:8081?x=1")
  }

  func testLegacyAliasesOnlyApplyOnTheLegacyHost() {
    let raw = "exp://h:8081?disableOnboarding=1&disableFab=1&disableAutoLaunch=1&url=http%3A%2F%2Fother"
    let launch = launch(raw)

    XCTAssertFalse(launch.isLauncherCommand)
    XCTAssertFalse(launch.disablesOnboarding)
    XCTAssertFalse(launch.disablesFab)
    XCTAssertFalse(launch.disablesAutoLaunch)
    XCTAssertNil(launch.targetURL)
    XCTAssertEqual(launch.strippedURL.absoluteString, raw)
  }

  func testOpaqueUrlDoesNotCrash() {
    let launch = launch("mailto:a@b.c")

    XCTAssertFalse(launch.isLauncherCommand)
    XCTAssertNil(launch.targetURL)
    XCTAssertEqual(launch.strippedURL.absoluteString, "mailto:a@b.c")
  }

  func testPreservesPercentEncodingOfTheOtherParams() {
    let launch = launch("exp://h:8081/?snack-channel=a%2Bb&__expo_disable_fab=1")

    XCTAssertEqual(launch.strippedURL.absoluteString, "exp://h:8081/?snack-channel=a%2Bb")
  }
}
