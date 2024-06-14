// Copyright 2022-present 650 Industries. All rights reserved.

import Photos
import ExpoModulesCore

public class CameraPermissionRequester: NSObject, EXPermissionsRequester {
  static public func permissionType() -> String {
    return "camera"
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: AVMediaType.video) { [weak self] _ in
      resolve(self?.getPermissions())
    }
  }

  public func getPermissions() -> [AnyHashable: Any] {
    var systemStatus: AVAuthorizationStatus
    var status: EXPermissionStatus
    let cameraUsageDescription = Bundle.main.object(forInfoDictionaryKey: "NSCameraUsageDescription")
    if cameraUsageDescription == nil {
      EXFatal(EXErrorWithMessage("""
      This app is missing 'NSCameraUsageDescription', video services will fail. \
      Ensure this key exists in the app's Info.plist
      """))
      systemStatus = AVAuthorizationStatus.denied
    } else {
      systemStatus = AVCaptureDevice.authorizationStatus(for: AVMediaType.video)
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

    return [
      "status": status.rawValue
    ]
  }
}

public class MediaLibraryPermissionRequester: DefaultMediaLibraryPermissionRequester,
                                              EXPermissionsRequester {
  public static func permissionType() -> String {
    return "mediaLibrary"
  }
}

public class MediaLibraryWriteOnlyPermissionRequester: DefaultMediaLibraryPermissionRequester,
                                                       EXPermissionsRequester {
  public static func permissionType() -> String {
    return "mediaLibraryWriteOnly"
  }

  @available(iOS 14, *)
  override internal func accessLevel() -> PHAccessLevel {
    return PHAccessLevel.addOnly
  }
}

// MARK: - Permission requesters shared implementation extracted to an extension (mixin pattern)

/**
 * Dummy class just to prevent extending NSObject publicly/globally.
 */
public class DefaultMediaLibraryPermissionRequester: NSObject {}

/**
 * This extension is adding default implmentation for EXPermissionsRequester that can be shared by many classe.
 * In Swift language you cannot override static methods in subclasses, so you cannot subclass any already implemented
 * PermissionRequester as instances of this class are registered by the unique name coming from `static func permissionType()`.
 * To prevent repeating the similar code for every MediaLibrary PermissionRequester (the only differences so far are
 * aforementioned permissionType and accessLevel, while the latter can be easily overritten) I've extracted the code
 * to this extension. I'm using as a mixin that implements major part of EXPermissionsRequester protocol.
 */
extension DefaultMediaLibraryPermissionRequester {
  @objc
  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    let authorizationHandler = { [weak self] (_: PHAuthorizationStatus) in
      resolve(self?.getPermissions())
    }
    if #available(iOS 14.0, *) {
      PHPhotoLibrary.requestAuthorization(for: self.accessLevel(), handler: authorizationHandler)
    } else {
      PHPhotoLibrary.requestAuthorization(authorizationHandler)
    }
  }

  @objc
  public func getPermissions() -> [AnyHashable: Any] {
    var authorizationStatus: PHAuthorizationStatus
    if #available(iOS 14.0, *) {
      authorizationStatus = PHPhotoLibrary.authorizationStatus(for: self.accessLevel())
    } else {
      authorizationStatus = PHPhotoLibrary.authorizationStatus()
    }

    var status: EXPermissionStatus
    var scope: String

    switch authorizationStatus {
    case .authorized:
      status = EXPermissionStatusGranted
      scope = "all"
    case .limited:
      status = EXPermissionStatusGranted
      scope = "limited"
    case .denied, .restricted:
      status = EXPermissionStatusDenied
      scope = "none"
    case .notDetermined:
      fallthrough
    @unknown default:
      status = EXPermissionStatusUndetermined
      scope = "none"
    }

    return [
      "status": status.rawValue,
      "accessPrivileges": scope
    ]
  }

  @available(iOS 14, *)
  @objc
  internal func accessLevel() -> PHAccessLevel {
    return PHAccessLevel.readWrite
  }
}
