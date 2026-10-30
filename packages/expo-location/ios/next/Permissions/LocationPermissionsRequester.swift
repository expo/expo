import CoreLocation
import ExpoModulesCore

class LocationPermissionsRequester: NSObject, EXPermissionsRequester {
  let kind: LocationPermissionKind
  lazy var locationManager = CLLocationManager.makeOnMainThread()
  // Only accessed from the main thread, so it does not need to be synchronized
  private var pendingRequests: [(resolve: EXPromiseResolveBlock, reject: EXPromiseRejectBlock)] = []

  init(kind: LocationPermissionKind) {
    self.kind = kind
    super.init()
  }

  class func permissionType() -> String {
    preconditionFailure("Subclasses must override permissionType()")
  }

  func getPermissions() -> [AnyHashable: Any] {
    return currentResponse().toDictionary()
  }

  func requestPermissions(
    resolver resolve: @escaping EXPromiseResolveBlock,
    rejecter reject: @escaping EXPromiseRejectBlock
  ) {
    if let missingKey = LocationPlistKeys.firstMissing(in: kind.plistKeys) {
      let exception = MissingPlistKeyException(missingKey)
      reject(exception.code, exception.description, exception)
      return
    }

    let response = currentResponse()
    if !response.isUndetermined {
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
        await requestFromSystem()
      }
    }
  }

  @MainActor
  func requestFromSystem() async {
    preconditionFailure("Subclasses must override requestFromSystem()")
  }

  func whenInUseResponse(accuracy: CLAccuracyAuthorization) -> LocationPermissionResponse {
    return LocationPermissionResponse.whenInUse(accuracy: accuracy)
  }

  final func resolvePendingRequests() {
    let response = getPermissions()
    let requests = pendingRequests
    pendingRequests = []
    for request in requests {
      request.resolve(response)
    }
  }

  final func rejectPendingRequests(with error: Error) {
    let exception = PermissionRequestFailedException().causedBy(error)
    let requests = pendingRequests
    pendingRequests = []
    for request in requests {
      request.reject(exception.code, exception.description, exception)
    }
  }

  final func currentResponse() -> LocationPermissionResponse {
    guard LocationPlistKeys.firstMissing(in: kind.plistKeys) == nil else {
      return LocationPermissionResponse.denied
    }

    switch locationManager.authorizationStatus {
    case .authorizedWhenInUse:
      return whenInUseResponse(accuracy: locationManager.accuracyAuthorization)
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
