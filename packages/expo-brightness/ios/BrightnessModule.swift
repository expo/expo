import ExpoModulesCore

let brightnessChangeEvent = "Expo.brightnessDidChange"

public class BrightnessModule: Module {
  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("ExpoBrightness")

    OnCreate {
      appContext?.permissions?.register([
        BrightnessPermissionsRequester()
      ])
    }

    Events(brightnessChangeEvent)

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      guard let permissions = appContext?.permissions else {
        throw Exceptions.PermissionsModuleNotFound()
      }
      permissions.getPermissionUsingRequesterClass(
        BrightnessPermissionsRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      guard let permissions = appContext?.permissions else {
        throw Exceptions.PermissionsModuleNotFound()
      }
      permissions.askForPermission(
        usingRequesterClass: BrightnessPermissionsRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("setBrightnessAsync") { (brightnessValue: Double) in
      UIScreen.main.brightness = brightnessValue
    }
    .runOnQueue(.main)

    AsyncFunction("getBrightnessAsync") {
      return UIScreen.main.brightness
    }

    OnStartObserving {
      hasListeners = true
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.brightnessDidChange),
        name: UIScreen.brightnessDidChangeNotification,
        object: nil
      )
    }

    OnStopObserving {
      hasListeners = false
      NotificationCenter.default.removeObserver(
        self,
        name: UIScreen.brightnessDidChangeNotification,
        object: nil
      )
    }

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
    sendEvent(brightnessChangeEvent, ["brightness": UIScreen.main.brightness])
  }
}
