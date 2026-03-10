// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Registers the worklet runtime factory with ExpoModulesCore.
/// This is called automatically via +load in WorkletIntegrationLoader.mm.
@objc(EXWorkletIntegration)
public final class WorkletIntegration: NSObject {
  @objc public static func register() {
    AppContext.uiRuntimeFactory = { appContext, pointerValue, runtime in
      guard let pointer = WorkletRuntimeFactory.extractRuntimePointer(pointerValue, runtime: runtime) else {
        throw WorkletRuntimePointerExtractionException()
      }
      return WorkletRuntimeFactory.createWorkletRuntime(appContext, fromPointer: pointer)
    }
  }
}

private final class WorkletRuntimePointerExtractionException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot extract pointer to UI worklet runtime"
  }
}
