import ExpoModulesCore

// MARK: - ExpoBrownfieldStateModule

@ExpoModule(classes: [SharedState.self])
public class ExpoBrownfieldStateModule: Module {
  @Event("onKeyRecreated")
  var onKeyRecreated: ([String: String]) -> Void

  public override func didCreate() {
    BrownfieldStateInternal.shared.setExpoModule(self)
  }

  public override func willDestroy() {
    BrownfieldStateInternal.shared.clearExpoModule(self)
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
