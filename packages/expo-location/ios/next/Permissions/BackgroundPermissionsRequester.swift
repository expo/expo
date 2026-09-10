import CoreLocation
import ExpoModulesCore

final class BackgroundPermissionsRequester: NSObject, EXPermissionsRequester {
  private let locationManager: CLLocationManager
  // Declining Always leaves permissions at When In Use. Track the request so we report
  // background permission as denied instead of undetermined.
  private var wasAsked = false

  private lazy var source: LocationAuthorizationSource = {
    if #available(iOS 18.0, *) {
      return LocationAuthorizationServiceSessionSource(authorization: .always)
    }
    return AlwaysAuthorizationCompatibilitySource(locationManager: locationManager)
  }()

  override init() {
    locationManager = Thread.isMainThread ? CLLocationManager() : DispatchQueue.main.sync { CLLocationManager() }
    super.init()
  }

  static func permissionType() -> String {
    return "locationBackgroundNext"
  }

  func getPermissions() -> [AnyHashable: Any] {
    return currentResponse().toDictionary()
  }

  func requestPermissions(
    resolver resolve: @escaping EXPromiseResolveBlock,
    rejecter reject: @escaping EXPromiseRejectBlock
  ) {
    if !LocationPlistKeys.isIncludedInInfoPlist(LocationPlistKeys.whenInUse) {
      let exception = MissingPlistKeyException(LocationPlistKeys.whenInUse)
      reject(exception.code, exception.description, exception)
      return
    }
    if !LocationPlistKeys.isIncludedInInfoPlist(LocationPlistKeys.alwaysAndWhenInUse) {
      let exception = MissingPlistKeyException(LocationPlistKeys.alwaysAndWhenInUse)
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
        try await self.source.request()
        self.wasAsked = true
        resolve(self.currentResponse().toDictionary())
      } catch {
        let exception = PermissionRequestFailedException().causedBy(error)
        reject(exception.code, exception.description, exception)
      }
    }
  }

  private func currentResponse() -> LocationPermissionResponse {
    guard LocationPlistKeys.isIncludedInInfoPlist(LocationPlistKeys.whenInUse),
      LocationPlistKeys.isIncludedInInfoPlist(LocationPlistKeys.alwaysAndWhenInUse) else {
      return LocationPermissionResponse.denied
    }

    switch locationManager.authorizationStatus {
    case .authorizedWhenInUse:
      return wasAsked ? .denied : .undetermined
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
