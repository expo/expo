import ExpoModulesCore

private let selector = ["request", "Record", "Permission", ":"]

public class AudioRecordingRequester: NSObject, EXPermissionsRequester {
  public static func permissionType() -> String {
    return "audioRecording"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    let systemStatus = AVAudioSession.sharedInstance().recordPermission
    var status: EXPermissionStatus

    guard (Bundle.main.infoDictionary?["NSMicrophoneUsageDescription"]) != nil else {
      EXFatal(EXErrorWithMessage("""
        This app is missing NSMicrophoneUsageDescription, so audio services will fail.
        Add one of these keys to your bundle's Info.plist.
      """))
      return ["status": EXPermissionStatusDenied]
    }

    switch systemStatus {
    case .granted:
      status = EXPermissionStatusGranted
    case .denied:
      status = EXPermissionStatusDenied
    case .undetermined:
      status = EXPermissionStatusUndetermined
    @unknown default:
      status = EXPermissionStatusUndetermined
    }

    return [
      "status": status.rawValue
    ]
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    typealias PermissionRequestFunction = @convention(c) (AnyObject, Selector, @escaping (Bool) -> Void) -> Void
    let recordPermissionSelector = NSSelectorFromString(selector.joined())

    let session = AVAudioSession.sharedInstance()
    guard let method = class_getInstanceMethod(type(of: session), recordPermissionSelector) else {
      reject("AudioRecordingRequester", "Failed to request audio recording permission", nil)
      return
    }

    let imp = method_getImplementation(method)

    let requestPermission = unsafeBitCast(imp, to: PermissionRequestFunction.self)
    requestPermission(session, recordPermissionSelector) { [weak self] _ in
      guard let self else {
        reject("AudioRecordingRequester", "Failed to request audio recording permission", nil)
        return
      }
      resolve(self.getPermissions())
    }
  }
}
