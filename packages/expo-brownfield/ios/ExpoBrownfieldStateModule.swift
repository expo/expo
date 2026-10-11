import ExpoModulesCore

let KEY_RECREATED_EVENT_NAME = "onKeyRecreated"

// MARK: - ExpoBrownfieldStateModule

@ExpoModule("ExpoBrownfieldStateModule")
public final class ExpoBrownfieldStateModule: Module {
  public func definition() -> ModuleDefinition {
    Events(KEY_RECREATED_EVENT_NAME)

    Class(SharedState.self) {
      Constructor { (key: String) in
        return SharedState(key)
      }

      Function("get") { (state: SharedState) -> Any? in
        return state.get()
      }
    }

    OnCreate {
      BrownfieldStateInternal.shared.setExpoModule(self)
    }

    OnDestroy {
      BrownfieldStateInternal.shared.clearExpoModule(self)
    }
  }

  @JS
  func getSharedState(_ key: String) -> SharedState {
    return BrownfieldStateInternal.shared.getOrCreate(key)
  }

  @JS
  func deleteSharedState(_ key: String) {
    _ = BrownfieldStateInternal.shared.delete(key)
  }

  public func notifyKeyRecreated(_ key: String) {
    sendEvent(KEY_RECREATED_EVENT_NAME, ["key": key])
  }
}
