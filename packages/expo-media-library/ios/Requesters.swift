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
    PHPhotoLibrary.requestAuthorization(for: self.accessLevel(), handler: authorizationHandler)
  }

  @objc
  public func getPermissions() -> [AnyHashable: Any] {
    let authorizationStatus = PHPhotoLibrary.authorizationStatus(for: self.accessLevel())
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

  @objc
  internal func accessLevel() -> PHAccessLevel {
    return PHAccessLevel.readWrite
  }
}
