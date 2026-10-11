import ExpoModulesCore

// MARK: - ExpoBrownfieldStateModule

@ExpoModule("ExpoBrownfieldStateModule")
public class ExpoBrownfieldStateModule: Module {
  @Event("onKeyRecreated")
  var onKeyRecreated: ([String: String]) -> Void

  public override func didCreate() {
    BrownfieldStateInternal.shared.setExpoModule(self)
  }

  public override func willDestroy() {
    BrownfieldStateInternal.shared.clearExpoModule(self)
  }

  public func definition() -> ModuleDefinition {
    Class(SharedState.self) {
      Function("get") { (state: SharedState) -> Any? in
        return state.get()
      }
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
}
