// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoModulesJSI

/// Registers the worklet runtime factory with ExpoModulesCore.
/// This is called automatically via +load in WorkletIntegrationLoader.mm.
@objc(EXWorkletIntegration)
public final class WorkletIntegration: NSObject {
  @objc public static func register() {
    AppContext.uiRuntimeFactory = { _, pointerValue, runtime in
      // The worklet runtime pointer is passed as a JS ArrayBuffer containing the raw address.
      // This is an internal transport between the worklets package's own install code and this
      // factory — we trust the ArrayBuffer bytes to be a valid `jsi::Runtime *`. No authentication
      // is performed; the size check below is only a sanity guard against malformed transport.
      guard pointerValue.isArrayBuffer() else {
        throw WorkletRuntimePointerExtractionException()
      }
      let arrayBuffer = pointerValue.getArrayBuffer()
      guard arrayBuffer.size == MemoryLayout<UnsafeMutableRawPointer>.size else {
        throw WorkletRuntimePointerExtractionException()
      }
      let pointer = UnsafeMutableRawPointer(arrayBuffer.data()).load(as: UnsafeMutableRawPointer.self)
      guard let workletRuntime = WorkletRuntime(runtimePointer: pointer) else {
        throw WorkletRuntimePointerExtractionException()
      }
      return workletRuntime
    }
  }
}

private final class WorkletRuntimePointerExtractionException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot extract pointer to UI worklet runtime"
  }
}
