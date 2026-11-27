import ExpoModulesCore

private let selector = ["request", "Record", "Permission", ":"]

public class AudioRecordingRequester: NSObject, EXPermissionsRequester {
  typealias SystemPermissionRequest = (@escaping (Bool) -> Void) -> Void

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

  func requestPermissions(
    usageDescription: Any?,
    requestSystemPermission: SystemPermissionRequest? = nil,
    resolver resolve: @escaping EXPromiseResolveBlock,
    rejecter reject: @escaping EXPromiseRejectBlock
  ) {
    guard usageDescription != nil else {
      resolve(Self.permissions(systemStatus: AVAudioSession.sharedInstance().recordPermission, usageDescription: nil))
      return
    }

    guard let requestSystemPermission = requestSystemPermission ?? Self.systemPermissionRequest() else {
      reject("AudioRecordingRequester", "Failed to request audio recording permission", nil)
      return
    }

    // The system reports the outcome through this callback. Reading `recordPermission` from inside
    // it can still return `.undetermined`, which resolves a permission the user just granted as
    // not granted.
    requestSystemPermission { granted in
      resolve(Self.permissions(systemStatus: granted ? .granted : .denied, usageDescription: usageDescription))
    }
  }

  private static func systemPermissionRequest() -> SystemPermissionRequest? {
    typealias PermissionRequestFunction = @convention(c) (AnyObject, Selector, @escaping (Bool) -> Void) -> Void
    let recordPermissionSelector = NSSelectorFromString(selector.joined())

    let session = AVAudioSession.sharedInstance()
    guard let method = class_getInstanceMethod(type(of: session), recordPermissionSelector) else {
      return nil
    }

    let imp = method_getImplementation(method)

    let requestPermission = unsafeBitCast(imp, to: PermissionRequestFunction.self)
    return { handler in
      requestPermission(session, recordPermissionSelector, handler)
    }
  }
}
