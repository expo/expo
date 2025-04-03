// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MapKit

class MapPermissionRequester: NSObject, EXPermissionsRequester, CLLocationManagerDelegate {
  private var locationManager = CLLocationManager()
  private var resolve: EXPromiseResolveBlock?
  private var reject: EXPromiseRejectBlock?

  override init() {
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

  func getPermissions() -> [AnyHashable: Any] {
    var systemStatus: CLAuthorizationStatus
    let description = Bundle.main.infoDictionary?["NSLocationWhenInUseUsageDescription"] as? String

    if description != nil {
      systemStatus = locationManager.authorizationStatus
    } else {
      EXFatal(EXErrorWithMessage("""
      This app is missing 'NSLocationWhenInUseUsageDescription',
      so MapKit services will fail. Add this entry to your bundle's Info.plist.
      """))
      systemStatus = .denied
    }

    return permissionWith(status: systemStatus)
  }

  func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    if locationManager.authorizationStatus == .notDetermined {
      locationManager.requestWhenInUseAuthorization()
      self.resolve = resolve
      self.reject = reject
    } else {
      resolve(getPermissions())
    }
  }

  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    if let resolve {
      resolve(getPermissions())
      self.resolve = nil
      self.reject = nil
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    if let reject {
      reject("E_LOCATION_MANAGER", "location request failed with error", error)
      self.resolve = nil
      self.reject = nil
    }
  }
}
