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
      
      // Overload for dictionary/object
      Function("set") { (state: SharedState, value: [String: Any]?) in
        state.set(value)
      }
      
      // Overload for string
      Function("set") { (state: SharedState, value: String?) in
        state.set(value)
      }
      
      // Overload for number
      Function("set") { (state: SharedState, value: Double?) in
        state.set(value)
      }
      
      // Overload for bool
      Function("set") { (state: SharedState, value: Bool?) in
        state.set(value)
      }
      
      // Overload for array
      Function("set") { (state: SharedState, value: [Any]?) in
        state.set(value)
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
