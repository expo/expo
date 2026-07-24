// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class LocalNetworkConfigTests: XCTestCase {
  private func plist(services: Any?, description: Any?) -> [String: Any] {
    var dict: [String: Any] = [:]
    if let services { dict["NSBonjourServices"] = services }
    if let description { dict["NSLocalNetworkUsageDescription"] = description }
    return dict
  }

  func testConfiguredWhenServiceAndDescriptionPresent() {
    let dict = plist(services: ["_expo._tcp"], description: "Discover dev servers")
    XCTAssertTrue(LocalNetworkConfig.isConfigured(in: dict))
  }

  func testServiceMatchIsCaseInsensitive() {
    let dict = plist(services: ["_Expo._TCP"], description: "x")
    XCTAssertTrue(LocalNetworkConfig.isConfigured(in: dict))
  }

  func testServiceMatchToleratesTrailingDot() {
    let dict = plist(services: ["_expo._tcp."], description: "x")
    XCTAssertTrue(LocalNetworkConfig.isConfigured(in: dict))
  }

  func testNotConfiguredWhenBonjourServiceMissing() {
    let dict = plist(services: ["_other._tcp"], description: "x")
    XCTAssertFalse(LocalNetworkConfig.isConfigured(in: dict))
  }

  func testNotConfiguredWhenBonjourKeyAbsent() {
    let dict = plist(services: nil, description: "x")
    XCTAssertFalse(LocalNetworkConfig.isConfigured(in: dict))
  }

  func testNotConfiguredWhenDescriptionMissing() {
    let dict = plist(services: ["_expo._tcp"], description: nil)
    XCTAssertFalse(LocalNetworkConfig.isConfigured(in: dict))
  }

  func testNotConfiguredWhenDescriptionEmpty() {
    let dict = plist(services: ["_expo._tcp"], description: "")
    XCTAssertFalse(LocalNetworkConfig.isConfigured(in: dict))
  }

  func testNotConfiguredWhenNil() {
    XCTAssertFalse(LocalNetworkConfig.isConfigured(in: nil))
  }
}
