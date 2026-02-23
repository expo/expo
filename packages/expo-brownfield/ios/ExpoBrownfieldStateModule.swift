import ExpoModulesCore

// MARK: - ExpoBrownfieldStateModule

public class ExpoBrownfieldStateModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBrownfieldStateModule")

    Class(SharedState.self) {
      Constructor {
        return SharedState()
      }

      Function("get") { (state: SharedState) -> Any? in
        return state.get()
      }
      
      Function("set") { (state: SharedState, value: JavaScriptValue?) in
        state.set(value?.getRaw())
      }
    }

    Function("getSharedState") { (key: String) -> SharedState in
      return BrownfieldStateInternal.getOrCreate(key)
    }

    Function("deleteSharedState") { (key: String) in
      BrownfieldStateInternal.delete(key)
    }
  }
}
