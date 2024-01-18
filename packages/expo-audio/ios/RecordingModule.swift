import ExpoModulesCore

private let status = "onRecordingStatusUpdate"

public class RecordingModule: Module, RecordingResultHandler {
  private lazy var recordingDelegate = {
    RecordingDelegate(resultHandler: self)
  }()
  
  public func definition() -> ModuleDefinition {
    Name("ExpoRecording")
    
    Events(status)
    
    OnCreate {
      appContext?.permissions?.register([
        AudioRecordingRequester()
      ])
    }
    
    AsyncFunction("requestRecordingPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.askForPermission(
        usingRequesterClass: AudioRecordingRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
    
    AsyncFunction("getRecordingPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.getPermissionUsingRequesterClass(
        AudioRecordingRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
    
    Class(AudioRecorder.self) {
      Constructor { (url: String?) -> AudioRecorder in
        guard let cachesDir = appContext?.fileSystem?.cachesDirectory, var directory = URL(string: cachesDir) else {
          throw Exceptions.AppContextLost()
        }
        
        directory.appendPathComponent("Recording")
        FileSystemUtilities.ensureDirExists(at: directory)
        if let url {
          directory.appendingPathComponent(url)
        }
        
        return AudioRecorder(createRecorder(url: directory))
      }
      
      Property("isRecording") { recorder in
        recorder.pointer.isRecording
      }
      
      Property("currentTime") { recorder in
        recorder.pointer.currentTime
      }
        
      Function("record") { recorder in
        try checkPermissions()
        recorder.pointer.record()
      }
      
      Function("stop") { recorder in
        try checkPermissions()
        recorder.pointer.stop()
      }
      
      Function("startRecordingAtTime") { (recorder, seconds: Double) in
        try checkPermissions()
        recorder.pointer.record(atTime: TimeInterval(seconds))
      }
      
      Function("recordForDuration") { (recorder, seconds: Double) in
        try checkPermissions()
        recorder.pointer.record(forDuration: TimeInterval(seconds))
      }
    }
  }
  
  func didFinish(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    sendEvent(status, [
      "isFinished": true,
      "hasError": false,
      "url": recorder.url
    ])
  }
  
  func encodeErrorDidOccuer(_ recorder: AVAudioRecorder, error: Error?) {
    sendEvent(status, [
      "isFinished": true,
      "hasError": true,
      "error": error?.localizedDescription,
      "url": nil
    ])
  }
  
  private func createRecorder(url: URL?) -> AVAudioRecorder {
    let recorder = {
      if let url {
        do {
          return try AVAudioRecorder(url: url, settings: [AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: 8.0, AVNumberOfChannelsKey: 64])
        } catch {
          return AVAudioRecorder()
        }
      }
      return AVAudioRecorder()
    }()
    
    recorder.delegate = recordingDelegate
    return recorder
  }
  
  private func checkPermissions() throws {
    switch AVAudioSession.sharedInstance().recordPermission {
    case .denied, .undetermined:
      throw AudioPermissionsException()
    default:
      break
    }
  }
}
