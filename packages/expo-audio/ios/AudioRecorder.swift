import ExpoModulesCore

class AudioRecorder: SharedRef<AVAudioRecorder>, Identifiable {
  public var id = UUID().uuidString
}
