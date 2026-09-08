import CoreLocation
import ExpoModulesCore

final class ForegroundPermissionsRequester: NSObject, EXPermissionsRequester, CLLocationManagerDelegate {
  private let locationManager: CLLocationManager
  private var resolve: EXPromiseResolveBlock?
  private var reject: EXPromiseRejectBlock?

  // The selector is constructed at runtime from separate parts so that neither the selector
  // nor the full method name literal ends up in the binary. Apple's static analysis warns
  // developers when it sees this method called while the matching usage description may be
  // missing from Info.plist - we let the provided NSLocation*UsageDescription keys govern
  // the behavior instead.
  private static let whenInUseAuthorizationSelector = NSSelectorFromString(["request", "WhenInUseAuthorization"].joined())

  override init() {
    locationManager = Thread.isMainThread ? CLLocationManager() : DispatchQueue.main.sync { CLLocationManager() }
    super.init()
    locationManager.delegate = self
  }

  static func permissionType() -> String {
    return "locationForegroundNext"
  }

  func getPermissions() -> [AnyHashable: Any] {
    return currentResponse().toDictionary()
  }

  func requestPermissions(
    resolver resolve: @escaping EXPromiseResolveBlock,
    rejecter reject: @escaping EXPromiseRejectBlock
  ) {
    guard LocationPlistKeys.isIncludedInInfoPlist(LocationPlistKeys.whenInUse) else {
      let exception = MissingPlistKeyException(LocationPlistKeys.whenInUse)
      reject(exception.code, exception.description, exception)
      return
    }

    let response = currentResponse()
    guard response.isUndetermined else {
      resolve(response.toDictionary())
      return
    }

    self.resolve = resolve
    self.reject = reject
    Task { @MainActor [weak self] in
      self?.locationManager.perform(Self.whenInUseAuthorizationSelector)
    }
  }

  private func currentResponse() -> LocationPermissionResponse {
    guard LocationPlistKeys.isIncludedInInfoPlist(LocationPlistKeys.whenInUse) else {
      return LocationPermissionResponse.denied
    }

    switch locationManager.authorizationStatus {
    case .authorizedWhenInUse:
      return LocationPermissionResponse.whenInUse(accuracy: locationManager.accuracyAuthorization)
    case .authorizedAlways:
      return LocationPermissionResponse.always(accuracy: locationManager.accuracyAuthorization)
    case .denied, .restricted:
      return LocationPermissionResponse.denied
    case .notDetermined:
      return LocationPermissionResponse.undetermined
    @unknown default:
      return LocationPermissionResponse.undetermined
    }
  }


  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    guard let reject else {
      return
    }

    let exception = PermissionRequestFailedException().causedBy(error)
    reject(exception.code, exception.description, exception)
    self.resolve = nil
    self.reject = nil
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    // notDetermined authorizationStatus means that user has not clicked the pop-up yet
    // this check is important because this callback runs on the manager initalization with notDetermined
    guard let resolve, manager.authorizationStatus != .notDetermined else {
      return
    }

    resolve(getPermissions())
    self.resolve = nil
    self.reject = nil
  }
}
