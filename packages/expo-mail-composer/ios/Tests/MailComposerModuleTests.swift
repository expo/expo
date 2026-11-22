// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import MessageUI
import Testing

@testable import ExpoMailComposer
@testable import ExpoModulesCore

@Suite("MailComposerModule")
@JavaScriptActor
struct MailComposerModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: MailComposerModule(appContext: appContext), name: nil)
  }

  @Test
  func `isAvailableAsync resolves to whether the device can send mail`() async throws {
    let isAvailable = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoMailComposer.isAvailableAsync()").asBool()
    }
    #expect(isAvailable == MFMailComposeViewController.canSendMail())
  }

  @Test(.enabled(if: !MFMailComposeViewController.canSendMail()))
  func `composeAsync rejects when the device can't send mail`() async throws {
    let code = try await runtime.execute {
      try await runtime.evalAsync(
        """
        expo.modules.ExpoMailComposer.composeAsync({ subject: 'Hello' })
          .then(() => 'resolved', error => String(error.code))
        """
      ).asString()
    }
    #expect(code == CannotSendMailException().code)
  }

  @Test
  func `getClients returns the mail clients with a label and a URL`() async throws {
    let isValid = try await runtime.execute {
      try runtime.eval(
        """
        (() => {
          const clients = expo.modules.ExpoMailComposer.getClients();
          return Array.isArray(clients) && clients.every(
            (client) => typeof client.label === 'string' && typeof client.url === 'string'
          );
        })()
        """
      ).asBool()
    }
    #expect(isValid)
  }
}
