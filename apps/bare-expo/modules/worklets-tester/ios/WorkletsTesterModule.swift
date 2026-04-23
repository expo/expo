import ExpoModulesCore
import ExpoModulesWorklets

public final class WorkletsTesterModule: Module {
  // `_uiRuntime` is reached through `EXAppContextProtocol` — see
  // `EXWorkletsUIRuntimeFactory.h` for the reason.
  private var uiWorkletRuntime: WorkletRuntime? {
    (appContext as? any EXAppContextProtocol)?._uiRuntime as? WorkletRuntime
  }

  public func definition() -> ModuleDefinition {
    Name("WorkletsTesterModule")

    Function("executeWorklet") { (worklet: Worklet) in
      guard let uiRuntime = uiWorkletRuntime else {
        throw Exceptions.RuntimeLost()
      }
      worklet.execute(on: uiRuntime)
    }

    Function("scheduleWorklet") { (worklet: Worklet) in
      guard let uiRuntime = uiWorkletRuntime else {
        throw Exceptions.RuntimeLost()
      }
      worklet.schedule(on: uiRuntime)
    }

    Function("executeWorkletWithArgs") { (worklet: Worklet) in
      guard let uiRuntime = uiWorkletRuntime else {
        throw Exceptions.RuntimeLost()
      }
      worklet.execute(on: uiRuntime, arguments: [2026, "worklet", true])
    }

    Function("scheduleWorkletWithArgs") { (worklet: Worklet) in
      guard let uiRuntime = uiWorkletRuntime else {
        throw Exceptions.RuntimeLost()
      }
      worklet.schedule(on: uiRuntime, arguments: [2026, "worklet", true])
    }
  }
}
