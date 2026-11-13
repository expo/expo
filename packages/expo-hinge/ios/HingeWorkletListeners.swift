import ExpoModulesCore
import ExpoModulesWorklets

/// Worklets that run on the UI runtime with every hinge change. Call `dispatch` on the main thread,
/// which runs the UI runtime, so the worklets run synchronously with the change.
internal final class HingeWorkletListeners {
  private let lock = NSLock()
  private var nextId = 0
  private var listeners: [Int: Worklet] = [:]

  func add(_ worklet: Worklet) -> Int {
    return lock.withLock {
      nextId += 1
      listeners[nextId] = worklet
      return nextId
    }
  }

  func remove(_ id: Int) {
    lock.withLock {
      listeners[id] = nil
    }
  }

  func removeAll() {
    lock.withLock {
      listeners.removeAll()
    }
  }

  func dispatch(_ hinge: HingeState?, appContext: AppContext?) {
    let worklets = lock.withLock { Array(listeners.values) }
    invoke(worklets, with: hinge, appContext: appContext)
  }

  func dispatch(_ id: Int, with hinge: HingeState?, appContext: AppContext?) {
    guard let worklet = lock.withLock({ listeners[id] }) else {
      return
    }
    invoke([worklet], with: hinge, appContext: appContext)
  }

  private func invoke(_ worklets: [Worklet], with hinge: HingeState?, appContext: AppContext?) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard !worklets.isEmpty else {
      return
    }
    guard let runtime = appContext?._uiRuntime as? WorkletRuntime else {
      #if DEBUG
      log.warn("ExpoHinge: UI worklet runtime is not available, the hinge worklet listeners will not run.")
      #endif
      return
    }
    let event: [String: Any] = ["hinge": hinge?.dictionary ?? NSNull()]
    for worklet in worklets {
      worklet.execute(on: runtime, arguments: [event])
    }
  }
}
