import ExpoModulesCore

struct AudioMode: Record {
  @Field var playsInSilentMode: Bool = false
  @Field var interruptionMode: InterruptionMode = .mixWithOthers
  @Field var allowsRecording: Bool = false
  @Field var shouldPlayInBackground: Bool = false
  @Field var shouldRouteThroughEarpiece: Bool = false
  @Field var allowsBackgroundRecording: Bool = false
}

enum InterruptionMode: String, Enumerable {
  case mixWithOthers
  case doNotMix
  case duckOthers
}

enum LoopMode: String, Enumerable {
  case none
  case single
  case all
}

enum PitchCorrectionQuality: String, Enumerable {
  case low
  case medium
  case high

  func toPitchAlgorithm() -> AVAudioTimePitchAlgorithm {
    switch self {
    case .low:
      return .varispeed
    case .medium:
      return .timeDomain
    case .high:
      return .spectral
    }
  }
}

struct RecordingOptions: Record {
  @Field var directory: RecordingDirectory?
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
  @Field var isMeteringEnabled: Bool = false
}

enum RecordingDirectory: String, Enumerable {
  case cache
  case document
}

struct Metadata: Record {
  @Field var title: String?
  @Field var artist: String?
  @Field var albumTitle: String?
  @Field var artworkUrl: URL?
}

struct LockScreenOptions: Record {
  @Field var showSeekForward: Bool = false
  @Field var showSeekBackward: Bool = false
  @Field var isLiveStream: Bool? = false
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

struct RecordOptions: Record {
  @Field var atTime: Double?
  @Field var forDuration: Double?
}

enum AudioStreamEncoding: String, Enumerable {
  case float32
  case int16
}

struct AudioStreamOptions: Record {
  @Field var sampleRate: Double = 48000
  @Field var channels: Int = 1
  @Field var encoding: AudioStreamEncoding = .float32
}

enum AudioStreamFileFormat: String, Enumerable {
  case wav
  case pcm

  var fileExtension: String {
      rawValue
  }
}

struct AudioStreamFileRecordingOptions: Record {
  @Field var uri: URL? = nil
  @Field var directory: RecordingDirectory? = .cache
  @Field var format: AudioStreamFileFormat = .wav
}

struct AudioStreamFileRecordingStartResult: Record {
  @Field var uri: String? = nil
}

struct AudioStreamFileRecordingResult: Record {
  @Field var uri: String = ""
  @Field var duration: Double = 0.0
  @Field var size: Int = 0
  @Field var sampleRate: Int = 0
  @Field var channels: Int = 0
  @Field var encoding: AudioStreamEncoding  = .int16
}
