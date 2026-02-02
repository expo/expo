// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("AppCodeSignEntitlements")
struct AppCodeSignEntitlementsTests {
  @Test
  func `should have a nil appGroups array when initialized with default init`() {
    let entitlements = AppCodeSignEntitlements()
    #expect(entitlements.appGroups == nil)
  }

  @Test
  func `should parse valid JSON and set appGroups correctly`() {
    let jsonString = """
      {
        "appGroups": ["group.com.example.app"]
      }
      """
    let entitlements = AppCodeSignEntitlements.from(json: jsonString)
    #expect(entitlements.appGroups == ["group.com.example.app"])
  }

  @Test
  func `should return nil appGroups when initialized with invalid JSON`() {
    let jsonString = "{\"foo\"}"
    let entitlements = AppCodeSignEntitlements.from(json: jsonString)
    #expect(entitlements.appGroups == nil)
  }

  @Test
  func `should return nil appGroups when JSON structure is incorrect`() {
    let jsonString = """
      {
        "incorrectKey": ["group.com.example.app"]
      }
      """
    let entitlements = AppCodeSignEntitlements.from(json: jsonString)
    #expect(entitlements.appGroups == nil)
  }
}
