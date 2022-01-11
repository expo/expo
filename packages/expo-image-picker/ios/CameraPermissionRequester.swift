// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class CameraPermissionRequester : NSObject, EXPermissionsRequester {
  static public func permissionType() -> String {
    return "camera"
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) -> Void {
    // TODO: @bbarthec: don't we need to provide @strongify mechanism for closures retaining `self`?
    AVCaptureDevice.requestAccess(for: AVMediaType.video) { _ in
      resolve(self.getPermissions())
    }
  }

  public func getPermissions() -> [AnyHashable : Any] {
    var systemStatus: AVAuthorizationStatus
    var status: EXPermissionStatus
    let cameraUsageDescription = Bundle.main.object(forInfoDictionaryKey: "NSCameraUsageDescription")
    let microphoneUsageDescription = Bundle.main.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription")
    if (cameraUsageDescription == nil || microphoneUsageDescription == nil) {
      EXFatal(EXErrorWithMessage("This app is missing either 'NSCameraUsageDescription' or 'NSMicrophoneUsageDescription', so audio/video services will fail. Ensure both of these keys exist in app's Info.plist."))
      systemStatus = AVAuthorizationStatus.denied
    } else {
      systemStatus = AVCaptureDevice.authorizationStatus(for: AVMediaType.video)
    }
    
    switch (systemStatus) {
    case .authorized:
      status = EXPermissionStatusGranted
      break
    case .restricted, .denied:
      status = EXPermissionStatusDenied
      break
    case .notDetermined:
      status = EXPermissionStatusUndetermined
      break
    @unknown default:
      status = EXPermissionStatusUndetermined
      break
    }
    
    return [
      // TODO: (@bbarthec): had to return status.rawValue, because otherwise this value is casted to string in Obj-C
      "status": status.rawValue
    ]
  }
}
