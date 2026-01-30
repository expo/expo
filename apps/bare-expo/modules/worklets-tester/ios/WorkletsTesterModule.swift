import ExpoModulesCore

public final class WorkletsTesterModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WorkletsTesterModule")

    // Function("executeWorklet") { (worklet: Worklet) in
    //   guard let uiRuntime = try appContext?.uiRuntime else {
    //     throw Exceptions.RuntimeLost()
    //   }
    //   worklet.execute(on: uiRuntime)
    // }

    // Function("scheduleWorklet") { (worklet: Worklet) in
    //   guard let uiRuntime = try appContext?.uiRuntime else {
    //     throw Exceptions.RuntimeLost()
    //   }
    //   worklet.schedule(on: uiRuntime)
    // }

    // Function("executeWorkletWithArgs") { (worklet: Worklet) in
    //   guard let uiRuntime = try appContext?.uiRuntime else {
    //     throw Exceptions.RuntimeLost()
    //   }
    //   worklet.execute(on: uiRuntime, arguments: [2026, "worklet", true])
    // }

    // Function("scheduleWorkletWithArgs") { (worklet: Worklet) in
    //   guard let uiRuntime = try appContext?.uiRuntime else {
    //     throw Exceptions.RuntimeLost()
    //   }
    //   worklet.schedule(on: uiRuntime, arguments: [2026, "worklet", true])
    // }
  }
}
