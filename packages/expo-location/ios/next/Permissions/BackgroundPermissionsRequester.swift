import CoreLocation
import ExpoModulesCore

final class BackgroundPermissionsRequester: NSObject, EXPermissionsRequester {
  private lazy var locationManager = CLLocationManager.makeOnMainThread()
  private var wasAsked = false
  // Only accessed from the main thread, so it does not need to be synchronized
  private var pendingRequests: [(resolve: EXPromiseResolveBlock, reject: EXPromiseRejectBlock)] = []

  private lazy var alwaysAuthorizationRequest = LocationManagerAlwaysAuthorizationRequest(locationManager: locationManager)

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
    if let missingKey = LocationPlistKeys.firstMissing(in: LocationPermissionKind.background.plistKeys) {
      let exception = MissingPlistKeyException(missingKey)
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
      if isPromptAlreadyRequested {
        return
      }
      do {
        try await alwaysAuthorizationRequest.request()
        wasAsked = true
        let response = currentResponse().toDictionary()
        let requests = pendingRequests
        pendingRequests = []
        for request in requests {
          request.resolve(response)
        }
      } catch {
        let exception = PermissionRequestFailedException().causedBy(error)
        let requests = pendingRequests
        pendingRequests = []
        for request in requests {
          request.reject(exception.code, exception.description, exception)
        }
      }
    }
  }

  private func determinedResponse() -> LocationPermissionResponse? {
    let response = currentResponse()
    return response.isUndetermined ? nil : response
  }

  private func currentResponse() -> LocationPermissionResponse {
    guard LocationPlistKeys.firstMissing(in: LocationPermissionKind.background.plistKeys) == nil else {
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
