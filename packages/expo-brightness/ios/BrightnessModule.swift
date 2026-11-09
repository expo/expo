import ExpoModulesCore

private let brightnessChangeEvent = "Expo.brightnessDidChange"

@Record
struct BrightnessChangeEvent {
  var brightness: Double
}

@ExpoModule("ExpoBrightness")
public class BrightnessModule: Module {
  @Event("Expo.brightnessDidChange")
  var onBrightnessChange: (BrightnessChangeEvent) -> Void

  public override func didCreate() {
    appContext?.permissions?.register([
      BrightnessPermissionsRequester()
    ])
  }

  // Core calls the listening hooks for every event name, not only for the declared events.
  public override func didStartListening(event: String) {
    guard event == brightnessChangeEvent else {
      return
    }
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(self.brightnessDidChange),
      name: UIScreen.brightnessDidChangeNotification,
      object: nil
    )
  }

  public override func didStopListening(event: String) {
    guard event == brightnessChangeEvent else {
      return
    }
    NotificationCenter.default.removeObserver(
      self,
      name: UIScreen.brightnessDidChangeNotification,
      object: nil
    )
  }

  @JS
  func getPermissionsAsync() async throws -> [String: Any] {
    guard let permissions = appContext?.permissions else {
      throw Exceptions.PermissionsModuleNotFound()
    }
    return try await withPermissionsContinuation { resolve, reject in
      permissions.getPermissionUsingRequesterClass(
        BrightnessPermissionsRequester.self,
        resolve: resolve,
        reject: reject
      )
    }
  }

  @JS
  func requestPermissionsAsync() async throws -> [String: Any] {
    guard let permissions = appContext?.permissions else {
      throw Exceptions.PermissionsModuleNotFound()
    }
    return try await withPermissionsContinuation { resolve, reject in
      permissions.askForPermission(
        usingRequesterClass: BrightnessPermissionsRequester.self,
        resolve: resolve,
        reject: reject
      )
    }
  }

  @JS
  @MainActor
  func setBrightnessAsync(brightnessValue: Double) async {
    UIScreen.main.brightness = brightnessValue
  }

  @JS
  @MainActor
  func getBrightnessAsync() async -> Double {
    return UIScreen.main.brightness
  }

  @JS
  func getSystemBrightnessAsync() async {}

  @JS
  func setSystemBrightnessAsync() async {}

  @JS
  func isUsingSystemBrightnessAsync() async {}

  @JS
  func getSystemBrightnessModeAsync() async {}

  @JS
  func setSystemBrightnessModeAsync() async {}

  @objc
  private func brightnessDidChange() {
    onBrightnessChange(BrightnessChangeEvent(brightness: UIScreen.main.brightness))
  }

  private func withPermissionsContinuation(
    _ body: (@escaping EXPromiseResolveBlock, @escaping EXPromiseRejectBlock) -> Void
  ) async throws -> [String: Any] {
    return try await withCheckedThrowingContinuation { continuation in
      let resolve: EXPromiseResolveBlock = { result in
        continuation.resume(returning: result as? [String: Any] ?? [:])
      }
      let reject: EXPromiseRejectBlock = { code, message, _ in
        continuation.resume(throwing: Exception(name: code ?? "", description: message ?? "", code: code ?? ""))
      }
      body(resolve, reject)
    }
  }
}
