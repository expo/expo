import CoreLocation
import ExpoModulesCore

final class BackgroundPermissionsRequester: NSObject, EXPermissionsRequester {
  private let locationManager: CLLocationManager
  private var wasAsked = false

  private lazy var alwaysAuthorizationRequest = LocationManagerAlwaysAuthorizationRequest(locationManager: locationManager)

  override init() {
    if Thread.isMainThread {
      locationManager = CLLocationManager()
    } else {
      locationManager = DispatchQueue.main.sync { CLLocationManager() }
    }
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
    guard LocationPlistKeys.isIncludedInInfoPlist(LocationPlistKeys.whenInUse) else {
      let exception = MissingPlistKeyException(LocationPlistKeys.whenInUse)
      reject(exception.code, exception.description, exception)
      return
    }
    guard LocationPlistKeys.isIncludedInInfoPlist(LocationPlistKeys.alwaysAndWhenInUse) else {
      let exception = MissingPlistKeyException(LocationPlistKeys.alwaysAndWhenInUse)
      reject(exception.code, exception.description, exception)
      return
    }

    if let response = determinedResponse() {
      resolve(response.toDictionary())
      return
    }

    Task { @MainActor [weak self] in
      guard let self else {
        return
      }
      do {
        try await self.alwaysAuthorizationRequest.request()
        self.wasAsked = true
        resolve(self.currentResponse().toDictionary())
      } catch {
        let exception = PermissionRequestFailedException().causedBy(error)
        reject(exception.code, exception.description, exception)
      }
    }
  }

  private func determinedResponse() -> LocationPermissionResponse? {
    let response = currentResponse()
    return response.isUndetermined ? nil : response
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
