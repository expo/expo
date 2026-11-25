import ExpoModulesCore
import ExpoModulesJSI
import ExpoModulesWorklets

// `@unchecked Sendable`: the `.concurrent` functions send `self` off the JavaScript thread.
@ExpoModule(classes: [WorkletsTesterCounter.self])
public final class WorkletsTesterModule: Module, @unchecked Sendable {
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

  /// Runs work on the UI runtime from a thread of the concurrent pool and returns whether it ran on the main thread.
  @JS(.concurrent)
  func isUIRuntimeWorkOnMainThread() async throws -> Bool {
    let uiRuntime = try workletRuntime()
    return try await uiRuntime.execute {
      Thread.isMainThread
    }
  }

  /// Evaluates the source on the UI runtime, on its thread, and returns the result as a string.
  @JS(.concurrent)
  func evaluateOnUIRuntime(_ source: String) async throws -> String {
    let uiRuntime = try workletRuntime()
    return try await uiRuntime.execute {
      try uiRuntime.eval(source).asString()
    }
  }

  private func workletRuntime() throws -> WorkletRuntime {
    guard let uiRuntime = try appContext?.uiRuntime as? WorkletRuntime else {
      throw Exceptions.RuntimeLost()
    }
    return uiRuntime
  }
}

@SharedObject
public final class WorkletsTesterCounter: SharedObject {
  @JS
  var value = 0

  @JS
  init(value: Int) {
    self.value = value
  }

  @JS
  func increment() -> Int {
    value += 1
    return value
  }
}
