import ExpoModulesCore

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

public class DefaultMediaLibraryPermissionRequester: NSObject {}

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

    var status: PermissionStatus
    var scope: String

    switch authorizationStatus {
    case .authorized:
      status = .granted
      scope = "all"
    case .limited:
      status = .granted
      scope = "limited"
    case .denied, .restricted:
      status = .denied
      scope = "none"
    case .notDetermined:
      fallthrough
    @unknown default:
      status = .undetermined
      scope = "none"
    }

    return [
      "status": status.rawValue,
      "accessPrivileges": scope,
      "granted": status == .granted
    ]
  }

  @available(iOS 14, *)
  @objc
  internal func accessLevel() -> PHAccessLevel {
    return PHAccessLevel.readWrite
  }
}

