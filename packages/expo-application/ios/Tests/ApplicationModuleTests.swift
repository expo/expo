// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoApplication
@testable import ExpoModulesCore

@Suite("ApplicationModule")
@JavaScriptActor
struct ApplicationModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = AppContext.create()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: ApplicationModule(appContext: appContext),
        name: "ExpoApplication"
      )
    )
  }

  // MARK: - Constants

  @Test
  func `applicationId is the main bundle identifier`() throws {
    let result = try runtime.eval("expo.modules.ExpoApplication.applicationId")
    #expect(try result.asString() == Bundle.main.bundleIdentifier)
  }

  @Test
  func `applicationName is the display name from the Info.plist`() throws {
    let result = try runtime.eval("expo.modules.ExpoApplication.applicationName")

    if let displayName = Bundle.main.infoDictionary?["CFBundleDisplayName"] as? String {
      #expect(try result.asString() == displayName)
    } else {
      #expect(result.isNull())
    }
  }

  @Test
  func `nativeApplicationVersion and nativeBuildVersion come from the Info.plist`() throws {
    let infoPlist = Bundle.main.infoDictionary
    let version = try runtime.eval("expo.modules.ExpoApplication.nativeApplicationVersion")
    let build = try runtime.eval("expo.modules.ExpoApplication.nativeBuildVersion")

    #expect(try version.asString() == infoPlist?["CFBundleShortVersionString"] as? String)
    #expect(try build.asString() == infoPlist?["CFBundleVersion"] as? String)
  }

  // MARK: - Async functions

  @Test
  func `getInstallationTimeAsync resolves to the documents directory creation time in milliseconds`() async throws {
    let documentsUrl = try #require(FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).last)
    let attributes = try FileManager.default.attributesOfItem(atPath: documentsUrl.path)
    let creationDate = try #require(attributes[.creationDate] as? Date)

    let result = try await runtime.evalAsync("expo.modules.ExpoApplication.getInstallationTimeAsync()")

    #expect(try result.asDouble() == creationDate.timeIntervalSince1970 * 1000)
  }

  @Test
  func `getIosIdForVendorAsync resolves to the identifier for vendor`() async throws {
    let expected = await MainActor.run { UIDevice.current.identifierForVendor?.uuidString }

    let result = try await runtime.evalAsync("expo.modules.ExpoApplication.getIosIdForVendorAsync()")

    if let expected {
      #expect(try result.asString() == expected)
    } else {
      #expect(result.isNull())
    }
  }

  @Test
  func `getApplicationReleaseTypeAsync resolves to the simulator release type`() async throws {
    let result = try await runtime.evalAsync("expo.modules.ExpoApplication.getApplicationReleaseTypeAsync()")

    #expect(try result.asInt() == EXAppReleaseType.simulator.rawValue)
  }

  @Test
  func `getPushNotificationServiceEnvironmentAsync resolves to null without a provisioning profile`() async throws {
    let result = try await runtime.evalAsync(
      "expo.modules.ExpoApplication.getPushNotificationServiceEnvironmentAsync()"
    )

    #expect(result.isNull())
  }
}
