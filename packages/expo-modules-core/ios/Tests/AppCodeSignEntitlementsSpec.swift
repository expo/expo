// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class AppCodeSignEntitlementsSpec: ExpoSpec {
  override class func spec() {
    describe("AppCodeSignEntitlements") {
      it("should have a nil appGroups array when initialized with default init") {
        let entitlements = AppCodeSignEntitlements()
        expect(entitlements.appGroups).to(beNil())
      }

      it("should parse valid JSON and set appGroups correctly") {
        let jsonString = """
          {
            "appGroups": ["group.com.example.app"]
          }
          """
        let entitlements = AppCodeSignEntitlements.from(json: jsonString)
        expect(entitlements.appGroups).to(equal(["group.com.example.app"]))
      }

      it("should return nil appGroups when initialized with invalid JSON") {
        let jsonString = "{\"foo\"}"
        let entitlements = AppCodeSignEntitlements.from(json: jsonString)
        expect(entitlements.appGroups).to(beNil())
      }

      it("should return nil appGroups when JSON structure is incorrect") {
        let jsonString = """
          {
            "incorrectKey": ["group.com.example.app"]
          }
          """
        let entitlements = AppCodeSignEntitlements.from(json: jsonString)
        expect(entitlements.appGroups).to(beNil())
      }
    }
  }
}
