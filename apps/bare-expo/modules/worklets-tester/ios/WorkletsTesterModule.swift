import ExpoModulesCore
import ExpoModulesWorklets

@ExpoModule
public final class WorkletsTesterModule: Module {
  @JS
  func executeWorklet(_ worklet: Worklet) throws {
    worklet.execute(on: try workletRuntime())
  }

  @JS
  func scheduleWorklet(_ worklet: Worklet) throws {
    worklet.schedule(on: try workletRuntime())
  }

  @JS
  func executeWorkletWithArgs(_ worklet: Worklet) throws {
    worklet.execute(on: try workletRuntime(), arguments: [2026, "worklet", true])
  }

  @JS
  func scheduleWorkletWithArgs(_ worklet: Worklet) throws {
    worklet.schedule(on: try workletRuntime(), arguments: [2026, "worklet", true])
  }

  private func workletRuntime() throws -> WorkletRuntime {
    guard let uiRuntime = try appContext?.uiRuntime as? WorkletRuntime else {
      throw Exceptions.RuntimeLost()
    }
    return uiRuntime
  }
}
