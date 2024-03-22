import ExpoModulesCore
import Photos

public class MediaLibraryPermissionRequester: DefaultMediaLibraryPermissionRequester, EXPermissionsRequester {
  public static func permissionType() -> String {
    return "mediaLibrary"
  }
}

public class MediaLibraryWriteOnlyPermissionRequester: DefaultMediaLibraryPermissionRequester, EXPermissionsRequester {
  public static func permissionType() -> String {
    return "mediaLibraryWriteOnly"
  }

  @available(iOS 14.0, *)
  override internal func accessLevel() -> PHAccessLevel {
    return PHAccessLevel.addOnly
  }
}

public class DefaultMediaLibraryPermissionRequester: NSObject {}

extension DefaultMediaLibraryPermissionRequester {
  @objc
  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    let authorizationHandler = { (_: PHAuthorizationStatus) in
      resolve(self.getPermissions())
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
      "accessPrivileges": scope,
      "granted": status == EXPermissionStatusGranted
    ]
  }

  @available(iOS 14.0, *)
  @objc
  internal func accessLevel() -> PHAccessLevel {
    return PHAccessLevel.readWrite
  }
}
