import ExpoModulesCore
import AVFoundation

class CameraOnlyPermissionRequester: NSObject, EXPermissionsRequester {
  static func permissionType() -> String {
    "camera"
  }

  func getPermissions() -> [AnyHashable: Any] {
    var systemStatus: AVAuthorizationStatus
    var status: EXPermissionStatus

    let cameraUsuageDescription = Bundle.main.infoDictionary?["NSCameraUsageDescription"] as? String

    if let cameraUsuageDescription = cameraUsuageDescription {
      systemStatus = AVCaptureDevice.authorizationStatus(for: .video)
    } else {
      EXFatal(EXErrorWithMessage("""
      This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription,
      so audio/video services will fail. Add one of these entries to your bundle's Info.plist.
      """))
      systemStatus = .denied
    }

    switch systemStatus {
    case .authorized:
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

  func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .video) { [weak self] _ in
      resolve(self?.getPermissions())
    }
  }
}

class CameraPermissionRequester: NSObject, EXPermissionsRequester {
  static func permissionType() -> String {
    "camera"
  }

  func getPermissions() -> [AnyHashable: Any] {
    var systemStatus: AVAuthorizationStatus
    var status: EXPermissionStatus

    let cameraUsuageDescription = Bundle.main.infoDictionary?["NSCameraUsageDescription"] as? String
    let microphoneUsuageDescription = Bundle.main.infoDictionary?["NSMicrophoneUsageDescription"] as? String

    if let cameraUsuageDescription, let microphoneUsuageDescription {
      systemStatus = AVCaptureDevice.authorizationStatus(for: .video)
    } else {
      EXFatal(EXErrorWithMessage("""
      This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription,
      so audio/video services will fail. Add one of these entries to
      your bundle's Info.plist
      """))
      systemStatus = .denied
    }

    switch systemStatus {
    case .authorized:
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

  func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .video) { [weak self] _ in
      resolve(self?.getPermissions())
    }
  }
}

class CameraMicrophonePermissionRequester: NSObject, EXPermissionsRequester {
  static func permissionType() -> String {
    "microphone"
  }

  func getPermissions() -> [AnyHashable: Any] {
    var systemStatus: AVAuthorizationStatus
    var status: EXPermissionStatus

    let microphoneUsuageDescription = Bundle.main.infoDictionary?["NSMicrophoneUsageDescription"] as? String

    if let microphoneUsuageDescription {
      systemStatus = AVCaptureDevice.authorizationStatus(for: .audio)
    } else {
      EXFatal(EXErrorWithMessage("""
      This app is missing NSMicrophoneUsageDescription, so audio services will fail.
      Add this entry to your bundle's Info.plist.
      """))
      systemStatus = .denied
    }

    switch systemStatus {
    case .authorized:
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

  func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .audio) { [weak self] _ in
      resolve(self?.getPermissions())
    }
  }
}
