import ExpoModulesCore
import Foundation

class AudioRecorder: SharedRef<AVAudioRecorder>, Identifiable {
  var id = UUID().uuidString
}
