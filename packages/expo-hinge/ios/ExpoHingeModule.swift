import ExpoModulesCore

private let hingeChangeEvent = "hingeChange"

public class ExpoHingeModule: Module {
  private let observer = HingeObserver()
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

    OnCreate {
      observer.onChange = { [weak self] hinge in
        guard let self, self.hasListeners else {
          return
        }
        self.sendEvent(hingeChangeEvent, ["hinge": hinge?.dictionary ?? NSNull()])
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
