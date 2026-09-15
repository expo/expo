import CoreLocation
import ExpoModulesCore

final class ForegroundPermissionsRequester: NSObject, EXPermissionsRequester {
  private let locationManager: CLLocationManager

  private lazy var source: LocationAuthorizationSource = {
    if #available(iOS 18.0, *) {
      return LocationAuthorizationServiceSessionSource(authorization: .whenInUse)
    }
    return WhenInUseAuthorizationCompatibilitySource(locationManager: locationManager)
  }()

  override init() {
    locationManager = Thread.isMainThread ? CLLocationManager() : DispatchQueue.main.sync { CLLocationManager() }
    super.init()
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

    Task { @MainActor in
      let response = currentResponse()
      guard response.isUndetermined else {
        resolve(response.toDictionary())
        return
      }

      do {
        try await source.request()
        resolve(currentResponse().toDictionary())
      } catch {
        let exception = PermissionRequestFailedException().causedBy(error)
        reject(exception.code, exception.description, exception)
      }
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
}
