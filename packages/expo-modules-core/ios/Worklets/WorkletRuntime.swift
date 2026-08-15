// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import ExpoModulesCore

public class WorkletRuntime: JavaScriptRuntime, @unchecked Sendable {
  internal let handle: WorkletRuntimeHandle

  public init?(runtimePointer: UnsafeMutableRawPointer) {
    guard let handle = WorkletRuntimeHandle(rawPointer: runtimePointer) else {
      return nil
    }
    self.handle = handle
    super.init(unsafePointer: runtimePointer)
  }

  // MARK: - Worklet execution

  /**
   Schedules async worklet execution with arguments.
   */
  public func schedule(_ serializable: JavaScriptSerializable, arguments: [Any] = []) {
    handle.scheduleWorklet(serializable, arguments: arguments)
  }

  /**
   Executes worklet synchronously with arguments.
   */
  public func execute(_ serializable: JavaScriptSerializable, arguments: [Any] = []) {
    handle.executeWorklet(serializable, arguments: arguments)
  }
}
