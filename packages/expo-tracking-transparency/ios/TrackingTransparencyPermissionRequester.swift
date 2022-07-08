// Copyright 2022-present 650 Industries. All rights reserved.

import AppTrackingTransparency
import ExpoModulesCore

public class TrackingTransparencyPermissionRequester: NSObject, EXPermissionsRequester {
  static public func permissionType() -> String {
    return "appTracking"
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    if #available(iOS 14, *) {
      ATTrackingManager.requestTrackingAuthorization() { [weak self] _ in
        resolve(self?.getPermissions());
      }
    } else {
      resolve(self.getPermissions());
    }
  }

  public func getPermissions() -> [AnyHashable: Any] {
    var status: EXPermissionStatus
    
    if #available(iOS 14, *) {
      var systemStatus = ATTrackingManager.trackingAuthorizationStatus
      switch systemStatus {
      case .authorized:
        status = EXPermissionStatusGranted
      case .restricted,
           .denied:
        status = EXPermissionStatusDenied
      case .notDetermined:
        fallthrough
      @unknown default:
        status = EXPermissionStatusUndetermined
      }
    } else {
      status = EXPermissionStatusGranted
    }

    return [
      "status": status.rawValue
    ]
  }
}
