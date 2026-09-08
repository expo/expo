import CoreLocation
import ExpoModulesCore

final class BackgroundPermissionsRequester: NSObject, EXPermissionsRequester {
  private let locationManager: CLLocationManager
  private var wasAsked = false

  private lazy var source: AlwaysAuthorizationSource = {
    if #available(iOS 18.0, *) {
      return AlwaysAuthorizationServiceSessionSource()
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
    let requiredKeys = [LocationPlistKeys.whenInUse, LocationPlistKeys.alwaysAndWhenInUse]
    if let missingKey = requiredKeys.first(where: { !LocationPlistKeys.isIncludedInInfoPlist($0) }) {
      let exception = MissingPlistKeyException(missingKey)
      reject(exception.code, exception.description, exception)
      return
    }

    let response = currentResponse()
    guard response.isUndetermined else {
      resolve(response.toDictionary())
      return
    }

    Task { @MainActor [weak self] in
      guard let self else {
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
      return LocationPermissionResponse.whenInUse(
        status: wasAsked ? EXPermissionStatusDenied : EXPermissionStatusUndetermined,
        accuracy: locationManager.accuracyAuthorization
      )
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
