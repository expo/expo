// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class UpdatesConfigOverrideSpec: ExpoSpec {
  override class func spec() {
    beforeEach {
      // Clear UserDefaults before each test
      UserDefaults.standard.removeObject(forKey: "dev.expo.updates.updatesConfigOverride")
    }

    describe("UpdatesConfigOverride") {
      describe("constructor") {
        it("should create instance with provided values") {
          let updateUrl = URL(string: "https://example.com/manifest")
          let requestHeaders = ["Authorization": "Bearer token", "User-Agent": "ExpoApp"]

          let override = UpdatesConfigOverride(updateUrl: updateUrl, requestHeaders: requestHeaders)

          expect(override.updateUrl).to(equal(updateUrl))
          expect(override.requestHeaders).to(equal(requestHeaders))
        }

        it("should create instance with null values") {
          let override = UpdatesConfigOverride(updateUrl: nil, requestHeaders: nil)

          expect(override.updateUrl).to(beNil())
          expect(override.requestHeaders).to(beNil())
        }
      }

      describe("load") {
        it("should return nil when no stored configuration exists") {
          let result = UpdatesConfigOverride.load()

          expect(result).to(beNil())
        }

        it("should return configuration when stored configuration exists") {
          let updateUrl = URL(string: "https://example.com/manifest")
          let requestHeaders = ["Authorization": "Bearer token"]
          let override = UpdatesConfigOverride(updateUrl: updateUrl, requestHeaders: requestHeaders)
          UpdatesConfigOverride.save(configOverride: override)

          let result = UpdatesConfigOverride.load()

          expect(result).toNot(beNil())
          expect(result?.updateUrl).to(equal(updateUrl))
          expect(result?.requestHeaders).to(equal(requestHeaders))
        }

        it("should return configuration from partial stored configurations") {
          let requestHeaders = ["Authorization": "Bearer token"]
          let override = UpdatesConfigOverride(updateUrl: nil, requestHeaders: requestHeaders)
          UpdatesConfigOverride.save(configOverride: override)

          let result = UpdatesConfigOverride.load()

          expect(result).toNot(beNil())
          expect(result?.updateUrl).to(beNil())
          expect(result?.requestHeaders).to(equal(requestHeaders))
        }
      }

      describe("save with configOverride") {
        it("should store configuration when override is not null") {
          let updateUrl = URL(string: "https://example.com/manifest")
          let requestHeaders = ["Authorization": "Bearer token"]
          let override = UpdatesConfigOverride(updateUrl: updateUrl, requestHeaders: requestHeaders)

          UpdatesConfigOverride.save(configOverride: override)

          let result = UpdatesConfigOverride.load()
          expect(result).toNot(beNil())
          expect(result?.updateUrl).to(equal(updateUrl))
          expect(result?.requestHeaders).to(equal(requestHeaders))
        }

        it("should remove configuration when override is null") {
          let override = UpdatesConfigOverride(updateUrl: URL(string: "https://example.com"), requestHeaders: ["key": "value"])
          UpdatesConfigOverride.save(configOverride: override)

          UpdatesConfigOverride.save(configOverride: nil)

          let result = UpdatesConfigOverride.load()
          expect(result).to(beNil())
        }
      }

      describe("save with requestHeaders") {
        it("should create new override when none exists") {
          let requestHeaders = ["Authorization": "Bearer token"]

          let result = UpdatesConfigOverride.save(requestHeaders: requestHeaders)

          expect(result).toNot(beNil())
          expect(result?.updateUrl).to(beNil())
          expect(result?.requestHeaders).to(equal(requestHeaders))

          let loaded = UpdatesConfigOverride.load()
          expect(loaded?.updateUrl).to(beNil())
          expect(loaded?.requestHeaders).to(equal(requestHeaders))
        }

        it("should update existing override") {
          let existingUrl = URL(string: "https://example.com/manifest")
          let existingOverride = UpdatesConfigOverride(updateUrl: existingUrl, requestHeaders: nil)
          UpdatesConfigOverride.save(configOverride: existingOverride)

          let newHeaders = ["User-Agent": "ExpoApp"]

          let result = UpdatesConfigOverride.save(requestHeaders: newHeaders)

          expect(result).toNot(beNil())
          expect(result?.updateUrl).to(equal(existingUrl))
          expect(result?.requestHeaders).to(equal(newHeaders))
        }

        it("should return nil when requestHeaders is nil and no other values exist") {
          let result = UpdatesConfigOverride.save(requestHeaders: nil)

          expect(result).to(beNil())
          expect(UpdatesConfigOverride.load()).to(beNil())
        }
      }
    }
  }
}
