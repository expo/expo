// Copyright 2022-present 650 Industries. All rights reserved.

import AppTrackingTransparency
import ExpoModulesCore

public class TrackingTransparencyPermissionRequester: NSObject, EXPermissionsRequester {
  var pendingResolver: EXPromiseResolveBlock?
  var pendingRejecter: EXPromiseRejectBlock?

  override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleApplicationDidBecomeActive),
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  static public func permissionType() -> String {
    return "appTracking"
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    if #available(iOS 14, *) {
      ATTrackingManager.requestTrackingAuthorization { [weak self] systemStatus in
        // iOS 17.4 ATT bug https://forums.developer.apple.com/forums/thread/746432
        // we use the didBecomeActiveNotification to recognize when the permission modal has been closed,
        // refetch the permissions and return them to the original promise.
        if systemStatus == .denied, ATTrackingManager.trackingAuthorizationStatus == .notDetermined {
          self?.pendingResolver = resolve
          self?.pendingRejecter = reject
        } else {
          resolve([
            "status": systemStatus.toPermissionStatus().rawValue
          ])
          self?.pendingRejecter = nil
          self?.pendingResolver = nil
        }
      }
    } else {
      resolve(self.getPermissions())
      self.pendingRejecter = nil
      self.pendingResolver = nil
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
      status = systemStatus.toPermissionStatus()
    } else {
      status = EXPermissionStatusGranted
    }

    return [
      "status": status.rawValue
    ]
  }

  @objc private func handleApplicationDidBecomeActive() {
    if let pendingResolver, let pendingRejecter {
      requestPermissions(resolver: pendingResolver, rejecter: pendingRejecter)
    }
  }
}

@available(iOS 14, *)
private extension ATTrackingManager.AuthorizationStatus {
  func toPermissionStatus() -> EXPermissionStatus {
    switch self {
    case .authorized:
      return EXPermissionStatusGranted
    case .restricted, .denied:
      return EXPermissionStatusDenied
    case .notDetermined:
      fallthrough
    @unknown default:
      return EXPermissionStatusUndetermined
    }
  }
}
