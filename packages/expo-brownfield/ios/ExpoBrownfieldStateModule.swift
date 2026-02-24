import ExpoModulesCore

let KEY_RECREATED_EVENT_NAME = "onKeyRecreated"

// MARK: - ExpoBrownfieldStateModule

public class ExpoBrownfieldStateModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBrownfieldStateModule")

    Events(KEY_RECREATED_EVENT_NAME)

    Class(SharedState.self) {
      Constructor { (key: String) in
        return SharedState(key)
      }

      Function("get") { (state: SharedState) -> Any? in
        return state.get()
      }
      
      Function("set") { (state: SharedState, value: JavaScriptValue?) in
        state.set(value?.getRaw())
      }
    }

    OnCreate {
      BrownfieldStateInternal.shared.setExpoModule(self)
    }

    OnDestroy {
      BrownfieldStateInternal.shared.setExpoModule(nil)
    }

    Function("getSharedState") { (key: String) -> SharedState in
      return BrownfieldStateInternal.shared.getOrCreate(key)
    }

    Function("deleteSharedState") { (key: String) in
      BrownfieldStateInternal.shared.delete(key)
    }
  }

  public func notifyKeyRecreated(_ key: String) {
    sendEvent(KEY_RECREATED_EVENT_NAME, ["key": key])
  }
}
