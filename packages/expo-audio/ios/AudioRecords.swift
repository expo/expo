import ExpoModulesCore

enum AudioCategory: String, Enumerable {
  case ambient
  case multiRoute
  case playAndRecord
  case playback
  case record
  case soloAmbient
  
  func toAVCategory() -> AVAudioSession.Category {
    switch self {
    case .ambient:
      return .ambient
    case .multiRoute:
      return .multiRoute
    case .playAndRecord:
      return .playAndRecord
    case .playback:
      return .playback
    case .record:
      return .record
    case .soloAmbient:
      return .soloAmbient
    }
  }
}

enum PitchCorrectionQuality: String, Enumerable {
  case low
  case medium
  case high
  
  func toPitchAlgorithm() -> AVAudioTimePitchAlgorithm {
    switch self {
    case .low:
      return .timeDomain
    case .medium:
      return .varispeed
    case .high:
      return .spectral
    }
  }
}
