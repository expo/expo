// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Registers the worklet runtime factory with ExpoModulesCore.
/// This is called automatically via +load in WorkletIntegrationLoader.mm.
///
/// `register()` is a no-op when `ExpoModulesWorkletsAdapter` isn't
/// linked (i.e. `react-native-worklets` isn't installed). In that case
/// `AppContext.uiRuntimeFactory` stays `nil`, and `CoreModule`'s
/// `installOnUIRuntime` throws the normal `WorkletUIRuntimeException`
/// rather than assigning a factory that would crash on first call.
@objc(EXWorkletIntegration)
public final class WorkletIntegration: NSObject {
  @objc public static func register() {
    guard let provider = ExpoWorkletsDiscovery.sharedProvider else {
      return
    }
    AppContext.uiRuntimeFactory = DefaultWorkletsUIRuntimeFactory(provider: provider)
  }
}

/// Concrete `WorkletsUIRuntimeFactory` that routes `AppContext`'s
/// UI-runtime creation through the `ExpoWorkletsProvider` discovered at
/// `register()` time. The provider is injected rather than looked up on
/// every call so this class is only instantiated when the adapter is
/// linked, guaranteeing `provider` is always valid.
internal final class DefaultWorkletsUIRuntimeFactory: NSObject, WorkletsUIRuntimeFactory {
  private let provider: ExpoWorkletsProvider

  init(provider: ExpoWorkletsProvider) {
    self.provider = provider
  }

  func createUIRuntime(
    pointerValue: JavaScriptValue,
    runtime: JavaScriptRuntime
  ) throws -> JavaScriptRuntime {
    guard let uiRuntime = provider.createWorkletRuntime(from: pointerValue, runtime: runtime) else {
      throw WorkletRuntimePointerExtractionException()
    }
    return uiRuntime
  }
}

private final class WorkletRuntimePointerExtractionException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot extract pointer to UI worklet runtime"
  }
}
