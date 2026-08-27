import ExpoModulesCore

private let selector = ["request", "Record", "Permission", ":"]

public class AudioRecordingRequester: NSObject, EXPermissionsRequester {
  public static func permissionType() -> String {
    return "audioRecording"
  }

  static var microphoneUsageDescription: Any? {
    Bundle.main.infoDictionary?["NSMicrophoneUsageDescription"]
  }

  public func getPermissions() -> [AnyHashable: Any] {
    return Self.permissions(
      systemStatus: AVAudioSession.sharedInstance().recordPermission,
      usageDescription: Self.microphoneUsageDescription
    )
  }

  static func permissions(
    systemStatus: AVAudioSession.RecordPermission,
    usageDescription: Any?
  ) -> [AnyHashable: Any] {
    var status: EXPermissionStatus

    guard usageDescription != nil else {
      log.error("""
        This app is missing NSMicrophoneUsageDescription, so audio recording will fail. \
        Add the key to the app's Info.plist, or set the `microphonePermission` option on the \
        expo-audio config plugin.
        """)
      return ["status": EXPermissionStatusDenied.rawValue]
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

  static func requireUsageDescription(_ usageDescription: Any? = AudioRecordingRequester.microphoneUsageDescription) throws {
    guard usageDescription != nil else {
      throw MicrophoneUsageDescriptionException()
    }
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    requestPermissions(usageDescription: Self.microphoneUsageDescription, resolver: resolve, rejecter: reject)
  }

  func requestPermissions(usageDescription: Any?, resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    guard usageDescription != nil else {
      resolve(Self.permissions(systemStatus: AVAudioSession.sharedInstance().recordPermission, usageDescription: nil))
      return
    }

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
