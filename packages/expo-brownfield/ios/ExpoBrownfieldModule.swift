import ExpoModulesCore

// MARK: - ExpoBrownfieldModule

@ExpoModule
public class ExpoBrownfieldModule: Module {
  @Event("onMessage")
  var onMessage: (BrownfieldMessage) -> Void

  public override func didStartListening(event: String) {
    BrownfieldMessagingInternal.shared.setExpoModule(self)
  }

  public override func didStopListening(event: String) {
    BrownfieldMessagingInternal.shared.clearExpoModule(self)
  }

  @JS
  func popToNative(_ animated: Bool) {
    DispatchQueue.main.async {
      NotificationCenter.default.post(
        name: Notification.Name("popToNative"),
        object: nil,
        userInfo: ["animated": animated]
      )
    }
  }

  @JS
  func setNativeBackEnabled(_ enabled: Bool) {
    DispatchQueue.main.async {
      NotificationCenter.default.post(
        name: Notification.Name("setNativeBackEnabled"),
        object: nil,
        userInfo: ["enabled": enabled]
      )
    }
  }

  @JS
  func sendMessage(_ message: borrowing JavaScriptValue) throws {
    let object = try message.asObject()
    var result: BrownfieldMessage = [:]

    // Same conversion as the `[String: Any?]` DSL argument: `undefined` properties are dropped
    // and `null` ones are kept as `nil`.
    for key in object.getPropertyNames() {
      let property = object.getProperty(key)
      if property.isUndefined() {
        continue
      }
      result.updateValue(property.isNull() ? nil : property.getAny(), forKey: key)
    }
    BrownfieldMessagingInternal.shared.emit(result)
  }
}
