// Copyright 2026-present 650 Industries. All rights reserved.

public class WorkletCallback: SharedObject {
  internal let worklet: Worklet

  internal init(worklet: Worklet) {
    self.worklet = worklet
    super.init()
  }

  // Executes the worklet synchronously on the UI runtime.
  public func call(arguments: [Any] = []) throws {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }
    let uiRuntime = try appContext.uiRuntime
    worklet.execute(on: uiRuntime, arguments: arguments)
  }

}
