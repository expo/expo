import CoreLocation
import ExpoModulesCore

final class ForegroundPermissionsRequester: NSObject, EXPermissionsRequester, CLLocationManagerDelegate {
  private lazy var locationManager: CLLocationManager = {
    let locationManager = Thread.isMainThread
      ? CLLocationManager()
      : DispatchQueue.main.sync { CLLocationManager() }
    locationManager.delegate = self
    return locationManager
  }()
  // Only accessed from the main thread, so it does not need to be synchronized
  private var pendingRequests: [(resolve: EXPromiseResolveBlock, reject: EXPromiseRejectBlock)] = []

  // The selector is constructed at runtime from separate parts so that neither the selector
  // nor the full method name literal ends up in the binary. Apple's static analysis warns
  // developers when it sees this method called while the matching usage description may be
  // missing from Info.plist - we let the provided NSLocation*UsageDescription keys govern
  // the behavior instead.
  private static let whenInUseAuthorizationSelector = NSSelectorFromString(["request", "WhenInUseAuthorization"].joined())

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

    if let response = determinedResponse() {
      resolve(response.toDictionary())
      return
    }

    Task { @MainActor [weak self] in
      guard let self else {
        return
      }
      let isPromptAlreadyRequested = !pendingRequests.isEmpty
      pendingRequests.append((resolve, reject))
      if !isPromptAlreadyRequested {
        locationManager.perform(Self.whenInUseAuthorizationSelector)
      }
    }
  }

  private func determinedResponse() -> LocationPermissionResponse? {
    let response = currentResponse()
    return response.isUndetermined ? nil : response
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
    let exception = PermissionRequestFailedException().causedBy(error)
    let requests = pendingRequests
    pendingRequests = []
    for request in requests {
      request.reject(exception.code, exception.description, exception)
    }
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    // notDetermined authorizationStatus means that user has not clicked the pop-up yet
    // this check is important because this callback runs on the manager initalization with notDetermined
    guard manager.authorizationStatus != .notDetermined else {
      return
    }

    let response = getPermissions()
    let requests = pendingRequests
    pendingRequests = []
    for request in requests {
      request.resolve(response)
    }
  }
}
