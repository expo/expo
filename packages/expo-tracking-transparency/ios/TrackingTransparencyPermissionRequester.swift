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
      var systemStatus: ATTrackingManager.AuthorizationStatus
      
      let trackingUsageDescription = Bundle.main.object(forInfoDictionaryKey: "NSUserTrackingUsageDescription")
      if trackingUsageDescription == nil {
        EXFatal(EXErrorWithMessage("""
        This app is missing 'NSUserTrackingUsageDescription' so tracking transparency will fail. \
        Ensure that this key exists in app's Info.plist.
        """))
        systemStatus = .denied
      } else {
        systemStatus = ATTrackingManager.trackingAuthorizationStatus
      }

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
