// Copyright 2022-present 650 Industries. All rights reserved.

import Photos
import ABI48_0_0ExpoModulesCore

public class CameraPermissionRequester: NSObject, ABI48_0_0EXPermissionsRequester {
  static public func permissionType() -> String {
    return "camera"
  }

  public func requestPermissions(resolver resolve: @escaping ABI48_0_0EXPromiseResolveBlock, rejecter reject: ABI48_0_0EXPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: AVMediaType.video) { [weak self] _ in
      resolve(self?.getPermissions())
    }
  }

  public func getPermissions() -> [AnyHashable: Any] {
    var systemStatus: AVAuthorizationStatus
    var status: ABI48_0_0EXPermissionStatus
    let cameraUsageDescription = Bundle.main.object(forInfoDictionaryKey: "NSCameraUsageDescription")
    let microphoneUsageDescription = Bundle.main.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription")
    if cameraUsageDescription == nil || microphoneUsageDescription == nil {
      ABI48_0_0EXFatal(ABI48_0_0EXErrorWithMessage("""
      This app is missing either 'NSCameraUsageDescription' or 'NSMicrophoneUsageDescription', so audio/video services will fail. \
      Ensure both of these keys exist in app's Info.plist.
      """))
      systemStatus = AVAuthorizationStatus.denied
    } else {
      systemStatus = AVCaptureDevice.authorizationStatus(for: AVMediaType.video)
    }

    switch systemStatus {
    case .authorized:
      status = ABI48_0_0EXPermissionStatusGranted
    case .restricted,
         .denied:
      status = ABI48_0_0EXPermissionStatusDenied
    case .notDetermined:
      fallthrough
    @unknown default:
      status = ABI48_0_0EXPermissionStatusUndetermined
    }

    return [
      "status": status.rawValue
    ]
  }
}

public class MediaLibraryPermissionRequester: DefaultMediaLibraryPermissionRequester,
                                              ABI48_0_0EXPermissionsRequester {
  public static func permissionType() -> String {
    return "mediaLibrary"
  }
}

public class MediaLibraryWriteOnlyPermissionRequester: DefaultMediaLibraryPermissionRequester,
                                                       ABI48_0_0EXPermissionsRequester {
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
 * This extension is adding default implmentation for ABI48_0_0EXPermissionsRequester that can be shared by many classe.
 * In Swift language you cannot override static methods in subclasses, so you cannot subclass any already implemented
 * PermissionRequester as instances of this class are registered by the unique name coming from `static func permissionType()`.
 * To prevent repeating the similar code for every MediaLibrary PermissionRequester (the only differences so far are
 * aforementioned permissionType and accessLevel, while the latter can be easily overritten) I've extracted the code
 * to this extension. I'm using as a mixin that implements major part of ABI48_0_0EXPermissionsRequester protocol.
 */
extension DefaultMediaLibraryPermissionRequester {
  @objc
  public func requestPermissions(resolver resolve: @escaping ABI48_0_0EXPromiseResolveBlock, rejecter reject: ABI48_0_0EXPromiseRejectBlock) {
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

    var status: ABI48_0_0EXPermissionStatus
    var scope: String

    switch authorizationStatus {
    case .authorized:
      status = ABI48_0_0EXPermissionStatusGranted
      scope = "all"
    case .limited:
      status = ABI48_0_0EXPermissionStatusGranted
      scope = "limited"
    case .denied, .restricted:
      status = ABI48_0_0EXPermissionStatusDenied
      scope = "none"
    case .notDetermined:
      fallthrough
    @unknown default:
      status = ABI48_0_0EXPermissionStatusUndetermined
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
