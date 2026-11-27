// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoLinking
@testable import ExpoModulesCore

/// The tests share `ExpoLinkingRegistry.shared` and the default notification center, so they run serially.
@Suite("ExpoLinkingModule", .serialized)
@JavaScriptActor
struct ExpoLinkingModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    ExpoLinkingRegistry.shared.initialURL = nil
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: ExpoLinkingModule(appContext: appContext),
        name: "ExpoLinking"
      )
    )
  }

  @Test
  func `getLinkingURL returns null without an initial URL`() throws {
    let runtime = runtime
    let isNull = try runtime.execute {
      try runtime.eval("expo.modules.ExpoLinking.getLinkingURL()").isNull()
    }
    #expect(isNull)
  }

  @Test
  func `getLinkingURL returns the initial URL until clearInitialURL is called`() throws {
    ExpoLinkingRegistry.shared.initialURL = URL(string: "bareexpo://path?query=1")
    let runtime = runtime
    let (url, clearedIsNull) = try runtime.execute {
      let url = try runtime.eval("expo.modules.ExpoLinking.getLinkingURL()").asString()
      _ = try runtime.eval("expo.modules.ExpoLinking.clearInitialURL()")
      let cleared = try runtime.eval("expo.modules.ExpoLinking.getLinkingURL()").isNull()
      return (url, cleared)
    }
    #expect(url == "bareexpo://path?query=1")
    #expect(clearedIsNull)
    #expect(ExpoLinkingRegistry.shared.initialURL == nil)
  }

  @Test
  func `emits onURLReceived with the URL to JS listeners`() async throws {
    let runtime = runtime
    try await runtime.execute {
      _ = try runtime.eval(
        """
        globalThis.result = null
        globalThis.subscription = expo.modules.ExpoLinking.addListener('onURLReceived', payload => {
          globalThis.result = JSON.stringify(payload)
        })
        """
      )
    }

    NotificationCenter.default.post(
      name: onURLReceivedNotification,
      object: nil,
      userInfo: ["url": URL(string: "bareexpo://received")!]
    )

    let deadline = Date().addingTimeInterval(2)
    var result: String?
    while Date() < deadline {
      result = try await runtime.execute {
        let value = try runtime.eval("globalThis.result")
        return value.isString() ? try value.asString() : nil
      }
      if result != nil {
        break
      }
      try await Task.sleep(nanoseconds: 50_000_000)
    }
    try await runtime.execute {
      _ = try runtime.eval("globalThis.subscription.remove()")
    }
    #expect(result == #"{"url":"bareexpo://received"}"#)
  }
}
