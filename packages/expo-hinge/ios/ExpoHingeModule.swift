import ExpoModulesCore
import ExpoModulesWorklets

private let hingeChangeEvent = "hingeChange"

public class ExpoHingeModule: Module {
  private let observer = HingeObserver()
  private let workletListeners = HingeWorkletListeners()
  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("ExpoHinge")

    Constant("isAvailable") {
      return HingeObserver.isAvailable
    }

    Events(hingeChangeEvent)

    Function("getHinge") { () -> [String: Any]? in
      return observer.hinge?.dictionary
    }

    Function("addWorkletListener") { (worklet: Worklet) -> Int in
      let id = workletListeners.add(worklet)
      DispatchQueue.main.async { [workletListeners, observer, weak appContext] in
        workletListeners.dispatch(id, with: observer.hinge, appContext: appContext)
      }
      return id
    }

    Function("removeWorkletListener") { (id: Int) in
      workletListeners.remove(id)
    }

    OnCreate {
      observer.onChange = { [weak self] hinge in
        guard let self else {
          return
        }
        self.workletListeners.dispatch(hinge, appContext: self.appContext)
        if self.hasListeners {
          self.sendEvent(hingeChangeEvent, ["hinge": hinge?.dictionary ?? nil])
        }
      }
      Task { @MainActor in
        observer.attach()
      }
    }

    // The key window may not exist yet when the module is created, and a scene reconnect replaces it.
    OnAppBecomesActive {
      Task { @MainActor in
        observer.attach()
      }
    }

    OnDestroy {
      workletListeners.removeAll()
      Task { @MainActor in
        observer.detach()
      }
    }

    OnStartObserving(hingeChangeEvent) {
      hasListeners = true
    }

    OnStopObserving(hingeChangeEvent) {
      hasListeners = false
    }
  }
}
