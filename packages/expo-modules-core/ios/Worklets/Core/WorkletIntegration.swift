// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoModulesJSI

/// Registers the worklet runtime factory with ExpoModulesCore.
/// This is called automatically via +load in WorkletIntegrationLoader.mm.
@objc(EXWorkletIntegration)
public final class WorkletIntegration: NSObject {
  @objc public static func register() {
    AppContext.uiRuntimeFactory = { _, holder, runtime in
      let runtimePointer: UnsafeMutableRawPointer? = runtime.withUnsafePointee { runtimePointee in
        holder.withUnsafePointee { holderPointee in
          WorkletRuntimeResolver.uiRuntimePointer(runtimePointer: runtimePointee, holderPointer: holderPointee)
        }
      }
      guard let runtimePointer, let workletRuntime = WorkletRuntime(runtimePointer: runtimePointer) else {
        throw WorkletRuntimePointerExtractionException()
      }
      return workletRuntime
    }
  }
}

internal final class WorkletRuntimePointerExtractionException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot extract pointer to UI worklet runtime"
  }
}
