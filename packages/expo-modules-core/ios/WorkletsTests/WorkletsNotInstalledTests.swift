// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore
@testable import ExpoModulesWorklets

/**
 The `use_expo_modules_tests!` harness does not link companion pods, so the worklets adapter
 never registers `WorkletsProviderRegistry.shared`. That nil-provider state is exactly an app
 where `react-native-worklets` isn't installed — so this is the right place to assert that a
 worklet operation fails with the actionable `WorkletsNotInstalledException` rather than a
 misleading lower-level error (e.g. "not an instance of Worklet").
 */
@Suite("WorkletsNotInstalled", .serialized)
@JavaScriptActor
struct WorkletsNotInstalledTests {
  @Test
  func `converting a worklet argument reports that worklets are not installed`() throws {
    // Only meaningful while the adapter is unlinked (the default in this test harness).
    try #require(WorkletsProviderRegistry.shared == nil)

    let appContext = AppContext.create()
    let runtime = try appContext.runtime
    // Any JS value works — with the adapter unlinked, extraction returns nil for everything.
    let jsValue = try runtime.eval("42")
    let dynamicType = DynamicSerializableType(innerType: Worklet.self)

    #expect(throws: WorkletsNotInstalledException.self) {
      _ = try dynamicType.cast(jsValue: jsValue, appContext: appContext)
    }
  }

  @Test
  func `UI runtime install fails with an error (not a crash) when the worklets adapter is not linked`() throws {
    // Only meaningful while the adapter is unlinked (the default in this test harness).
    try #require(WorkletsProviderRegistry.shared == nil)

    // Installs the core-side hook that turns a UI runtime holder into a runtime.
    WorkletIntegration.register()
    let factory = try #require(AppContext.uiRuntimeFactory)

    let appContext = AppContext.create()
    let runtime = try appContext.runtime
    // With no adapter linked the resolver returns NULL for any holder, so the
    // factory must throw rather than dereference a null runtime pointer.
    let holder = try runtime.eval("({})")

    #expect(throws: WorkletRuntimePointerExtractionException.self) {
      _ = try factory(appContext, holder, runtime)
    }
  }
}
