import ExpoModulesCore

@Record
struct SpeechOptions: Sendable {
  var language: String?
  var pitch: Double?
  var rate: Double?
  var voice: String?
  var useApplicationAudioSession: Bool?
  var volume: Float?
}

@Record
struct VoiceInfo {
  var identifier: String? = nil
  var name: String? = nil
  var quality: String? = nil
  var language: String? = nil
}

@Record
struct SpeechEvent {
  var id: String
}

@Record
struct SpeechWillSayNextStringEvent {
  var id: String
  var charIndex: Int
  var charLength: Int
}
