// Copyright 2026-present 650 Industries. All rights reserved.

public class WorkletCallback: SharedObject {
  internal let worklet: Worklet

  internal init(worklet: Worklet) {
    self.worklet = worklet
    super.init()
  }

  // Executes the worklet synchronously on the UI runtime and returns the result.
  public func callReturning(arguments: [Any] = []) throws -> Any? {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }
    let uiRuntime = try appContext.uiRuntime
    return worklet.executeReturning(on: uiRuntime, arguments: arguments)
  }

}
