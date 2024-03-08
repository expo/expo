import ExpoModulesCore
import Foundation

class AudioRecorder: SharedRef<AVAudioRecorder>, Identifiable {
  public var id = UUID().uuidString
}
