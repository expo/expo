import ExpoModulesCore

struct AudioMode: Record {
  @Field var playsInSilentMode: Bool = false
  @Field var interruptionMode: InterruptionMode = .mixWithOthers
  @Field var allowsRecording: Bool = true
  @Field var shouldPlayInBackground: Bool = true
}

enum InterruptionMode: String, Enumerable {
  case mixWithOthers
  case doNotMix
  case duckOthers
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

struct RecordingOptions: Record {
  @Field var `extension`: String
  @Field var sampleRate: Double
  @Field var numberOfChannels: Double
  @Field var bitRate: Double
  @Field var outputFormat: String?
  @Field var audioQuality: Int
  @Field var bitRateStrategy: BitRateStrategy?
  @Field var bitDepthHint: Double?
  @Field var linearPCMBitDepth: Double?
  @Field var linearPCMIsBigEndian: Bool?
  @Field var linearPCMIsFloat: Bool?
}

enum BitRateStrategy: String, Enumerable {
  case constant
  case longTermAverage
  case variableConstrained
  case variable

  func toAVBitRateStrategy() -> String {
    switch self {
    case .constant:
      return AVAudioBitRateStrategy_Constant
    case .longTermAverage:
      return AVAudioBitRateStrategy_LongTermAverage
    case .variableConstrained:
      return AVAudioBitRateStrategy_VariableConstrained
    case .variable:
      return AVAudioBitRateStrategy_Variable
    }
  }
}
