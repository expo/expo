import ExpoModulesCore

class MapPermissionRequester: NSObject, EXPermissionsRequester, CLLocationManagerDelegate {
  private var locationManager = CLLocationManager()
  private var _resolve: EXPromiseResolveBlock?
  private var _reject: EXPromiseRejectBlock?

  override public init() {
    super.init()
    locationManager.delegate = self
  }

  static func permissionType() -> String {
    return "location"
  }

  func permissionWith(status systemStatus: CLAuthorizationStatus) -> [AnyHashable: Any] {
    var status: EXPermissionStatus

    switch systemStatus {
    case .authorizedAlways, .authorizedWhenInUse:
      status = EXPermissionStatusGranted
    case .denied, .restricted:
      status = EXPermissionStatusDenied
    case .notDetermined:
      fallthrough
    @unknown default:
      status = EXPermissionStatusUndetermined
    }

    return [
      "status": status.rawValue
    ]
  }

  func getPermissions() -> [AnyHashable : Any]! {
    var systemStatus: CLAuthorizationStatus
    let description = Bundle.main.infoDictionary?["NSLocationWhenInUseUsageDescription"] as? String
    
    if description != nil {
      systemStatus = locationManager.authorizationStatus
    } else {
      EXFatal(EXErrorWithMessage("This app is missing 'NSLocationWhenInUseUsageDescription', so MapKit services will fail. Add this entry to your bundle's Info.plist."))
      systemStatus = .denied
    }

    return permissionWith(status: systemStatus)
  }

  func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    if locationManager.authorizationStatus == .notDetermined {
      locationManager.requestWhenInUseAuthorization()
      _resolve = resolve
      _reject = reject
    } else {
      resolve(getPermissions())
    }
  }

  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    if _resolve != nil {
      _resolve?(getPermissions())
      _resolve = nil
      _reject = nil
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    if _reject != nil {
      _reject = nil
      _reject = nil
    }
  }
}
