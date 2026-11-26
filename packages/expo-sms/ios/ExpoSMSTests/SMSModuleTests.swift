// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import MessageUI
import Testing

@testable import ExpoModulesCore
@testable import ExpoSMS

@Suite("ExpoSMSModule")
@JavaScriptActor
struct SMSModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: ExpoSMSModule(appContext: appContext), name: nil)
  }

  @Test
  func `isAvailableAsync resolves to whether the device can send text messages`() async throws {
    let isAvailable = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoSMS.isAvailableAsync()").asBool()
    }
    #expect(isAvailable == MFMessageComposeViewController.canSendText())
  }

  @Test(.enabled(if: !MFMessageComposeViewController.canSendText()))
  func `sendSMSAsync rejects when the device can't send text messages`() async throws {
    let code = try await runtime.execute {
      try await runtime.evalAsync(
        """
        expo.modules.ExpoSMS.sendSMSAsync(['0123456789'], 'Hello', {})
          .then(() => 'resolved', error => String(error.code))
        """
      ).asString()
    }
    #expect(code == SMSUnavailableException().code)
  }
}
