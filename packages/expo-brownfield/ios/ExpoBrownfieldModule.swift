import ExpoModulesCore

let NATIVE_MESSAGE_EVENT_NAME = "onMessage"

// MARK: - ExpoBrownfieldModule

public class ExpoBrownfieldModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBrownfieldModule")

    Events(NATIVE_MESSAGE_EVENT_NAME)

    OnStartObserving {
      BrownfieldMessagingInternal.shared.setExpoModule(self)
    }

    OnStopObserving {
      BrownfieldMessagingInternal.shared.setExpoModule(nil)
    }

    Function("popToNative") { (animated: Bool) in
      DispatchQueue.main.async {
        NotificationCenter.default.post(
          name: Notification.Name("popToNative"),
          object: nil,
          userInfo: ["animated": animated]
        )
      }
    }

    Function("setNativeBackEnabled") { (enabled: Bool) in
      DispatchQueue.main.async {
        NotificationCenter.default.post(
          name: Notification.Name("setNativeBackEnabled"),
          object: nil,
          userInfo: ["enabled": enabled]
        )
      }
    }

    Function("sendMessage") { (message: BrownfieldMessage) in
      BrownfieldMessagingInternal.shared.emit(message)
    }
  }

  public func sendMessage(_ message: BrownfieldMessage) {
    sendEvent(NATIVE_MESSAGE_EVENT_NAME, message)
  }
}
