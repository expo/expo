// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import ExpoModulesCore

public class WorkletRuntime: JavaScriptRuntime, @unchecked Sendable {
  internal let workletHandle: WorkletRuntimeHandle

  public init?(runtimePointer: UnsafeMutableRawPointer) {
    guard let workletHandle = WorkletRuntimeHandle(rawPointer: runtimePointer) else {
      return nil
    }
    // The scheduler of the worklet runtime, so that `schedule` and `execute` run on the thread of the worklet runtime.
    var dispatch: UnsafeRawPointer?
    guard let scheduler = WorkletsProviderRegistry.shared?.scheduler(runtimePointer: runtimePointer, dispatch: &dispatch),
      let dispatch
    else {
      return nil
    }
    self.workletHandle = workletHandle
    super.init(unsafePointer: runtimePointer, scheduler: scheduler, dispatch: dispatch)
  }

  // MARK: - Worklet execution

  /**
   Schedules async worklet execution with arguments.
   */
  public func schedule(_ serializable: JavaScriptSerializable, arguments: [Any] = []) {
    workletHandle.scheduleWorklet(serializable, arguments: arguments)
  }

  /**
   Executes worklet synchronously with arguments.
   */
  public func execute(_ serializable: JavaScriptSerializable, arguments: [Any] = []) {
    workletHandle.executeWorklet(serializable, arguments: arguments)
  }
}
