import ExpoModulesCore

class AudioRecordingRequester: NSObject, EXPermissionsRequester {
  static func permissionType() -> String! {
    "audioRecording"
  }
  
  func getPermissions() -> [AnyHashable : Any]! {
    var systemStatus = AVAudioSession.sharedInstance().recordPermission
    var status: EXPermissionStatus
    
    guard let usageDescription = Bundle.main.infoDictionary?["NSMicrophoneUsageDescription"] else {
      EXFatal(EXErrorWithMessage("This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."))
      return ["status": EXPermissionStatusDenied]
    }
    
    switch systemStatus {
    case .granted:
      status = EXPermissionStatusGranted
    case .denied:
      status = EXPermissionStatusDenied
    case .undetermined:
      status = EXPermissionStatusUndetermined
    }
    
    return [
      "status": status
    ]
  }
  
  func requestPermissions(resolver resolve: EXPromiseResolveBlock!, rejecter reject: EXPromiseRejectBlock!) {
    if #available(iOS 17.0, *) {
      AVAudioApplication.requestRecordPermission { granted in
        resolve(self.getPermissions())
      }
    } else {
      AVAudioSession.sharedInstance().requestRecordPermission { granted in
        resolve(self.getPermissions())
      }
    }
  }
}
