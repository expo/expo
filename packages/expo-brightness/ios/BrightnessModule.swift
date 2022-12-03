import ExpoModulesCore

public class BrightnessModule: Module {
  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("ExpoBrightness")

    OnCreate {
      appContext?.permissions?.register([
        BrightnessPermissionsRequester()
      ])
    }

    Events(BrightnessEvents.didChange)

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      guard let permissions = appContext?.permissions else {
        throw PermissionsModuleNotFoundException()
      }
      permissions.getPermissionUsingRequesterClass(
        BrightnessPermissionsRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter)
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      guard let permissions = appContext?.permissions else {
        throw PermissionsModuleNotFoundException()
      }
      permissions.askForPermission(
        usingRequesterClass: BrightnessPermissionsRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter)
    }

    // A Double was the only way to satisfy the compiler and avoid a cast. It won't accept a CGFloat argument
    // "Contextual closure type '() throws -> ()' expects 0 arguments, but 1 was used in closure body"
    AsyncFunction("setBrightnessAsync") { (brightnessValue: Double) in
      UIScreen.main.brightness = brightnessValue
    }.runOnQueue(.main)

    AsyncFunction("getBrightnessAsync") {
      return UIScreen.main.brightness
    }

    OnStartObserving {
      hasListeners = true
      NotificationCenter.default.addObserver(self,
                                             selector: #selector(self.brightnessDidChange),
                                             name: UIScreen.brightnessDidChangeNotification,
                                             object: nil)
    }

    OnStopObserving {
      hasListeners = false
      NotificationCenter.default.removeObserver(self,
                                                name: UIScreen.brightnessDidChangeNotification,
                                                object: nil)
    }

    // Are all of these still needed?
    AsyncFunction("getSystemBrightnessAsync") {}
    AsyncFunction("setSystemBrightnessAsync") {}
    AsyncFunction("useSystemBrightnessAsync") {}
    AsyncFunction("isUsingSystemBrightnessAsync") {}
    AsyncFunction("getSystemBrightnessModeAsync") {}
    AsyncFunction("setSystemBrightnessModeAsync") {}
  }

  @objc
  private func brightnessDidChange() {
    if !hasListeners {
      return
    }
    sendEvent(BrightnessEvents.didChange, ["brightness": UIScreen.main.brightness])
  }
}
