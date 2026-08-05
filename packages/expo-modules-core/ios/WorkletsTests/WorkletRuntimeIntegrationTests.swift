// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

import ExpoModulesCore
import ExpoModulesWorklets

/**
 Runtime-level checks for the worklets integration wiring.

 Note: these run under `use_expo_modules_tests!`, which does not link companion pods, so the
 worklets adapter — and therefore `WorkletsProviderRegistry.shared` — is intentionally absent
 here (the same state as an app without `react-native-worklets`). Whether the adapter is
 correctly autolinked is guarded by the JS test `WorkletsAdapterAutolinking-test.ts`; the
 consumer-side behaviour when it's missing is covered by `WorkletsNotInstalledTests`.
 */
@Suite("WorkletRuntimeIntegration", .serialized)
struct WorkletRuntimeIntegrationTests {
  @Test
  func `UI worklet runtime factory registers on the app context`() {
    // `WorkletIntegration.register()` installs the core-side hook (normally invoked via +load)
    // that turns a worklet runtime pointer into a usable runtime. Guards the factory wiring onto
    // AppContext; it does not require the adapter to be linked.
    WorkletIntegration.register()
    #expect(AppContext.uiRuntimeFactory != nil)
  }
}
