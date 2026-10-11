import ExpoModulesCore

let NATIVE_MESSAGE_EVENT_NAME = "onMessage"

// MARK: - ExpoBrownfieldModule

@ExpoModule("ExpoBrownfieldModule")
public final class ExpoBrownfieldModule: Module {
  public func definition() -> ModuleDefinition {
    Events(NATIVE_MESSAGE_EVENT_NAME)

    OnStartObserving {
      BrownfieldMessagingInternal.shared.setExpoModule(self)
    }

    OnStopObserving {
      BrownfieldMessagingInternal.shared.clearExpoModule(self)
    }
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

  @JS("sendMessage")
  func receiveMessage(_ message: JavaScriptValue) throws {
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

  public func sendMessage(_ message: BrownfieldMessage) {
    sendEvent(NATIVE_MESSAGE_EVENT_NAME, message)
  }
}
