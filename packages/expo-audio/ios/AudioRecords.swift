import ExpoModulesCore

@Record
struct AudioMode {
  var playsInSilentMode: Bool = true
  var interruptionMode: InterruptionMode = .mixWithOthers
  var allowsRecording: Bool = false
  var shouldPlayInBackground: Bool = false
  var shouldRouteThroughEarpiece: Bool = false
  var allowsBackgroundRecording: Bool = false
}

@Record
struct PartialAudioMode {
  var playsInSilentMode: Bool?
  var interruptionMode: InterruptionMode?
  var allowsRecording: Bool?
  var shouldPlayInBackground: Bool?
  var shouldRouteThroughEarpiece: Bool?
  var allowsBackgroundRecording: Bool?

  func merged(into current: AudioMode) -> AudioMode {
    AudioMode(
      playsInSilentMode: playsInSilentMode ?? current.playsInSilentMode,
      interruptionMode: interruptionMode ?? current.interruptionMode,
      allowsRecording: allowsRecording ?? current.allowsRecording,
      shouldPlayInBackground: shouldPlayInBackground ?? current.shouldPlayInBackground,
      shouldRouteThroughEarpiece: shouldRouteThroughEarpiece ?? current.shouldRouteThroughEarpiece,
      allowsBackgroundRecording: allowsBackgroundRecording ?? current.allowsBackgroundRecording
    )
  }
}

enum InterruptionMode: String, Enumerable {
  case mixWithOthers
  case doNotMix
  case doNotMixPersistent
  case duckOthers

  var preventsMixing: Bool {
    self == .doNotMix || self == .doNotMixPersistent
  }

  var shouldNotifyOthersOnDeactivation: Bool {
    self != .doNotMixPersistent
  }
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

@Record
struct RecordingOptions {
  var directory: RecordingDirectory?
  var fileName: String?
  var `extension`: String = ""
  var sampleRate: Double = 0
  var numberOfChannels: Double = 0
  var bitRate: Double = 0
  var outputFormat: String?
  var audioQuality: Int = 0
  var bitRateStrategy: BitRateStrategy?
  var bitDepthHint: Double?
  var linearPCMBitDepth: Double?
  var linearPCMIsBigEndian: Bool?
  var linearPCMIsFloat: Bool?
  var isMeteringEnabled: Bool = false
}

enum RecordingDirectory: String, Enumerable {
  case cache
  case document
}

@Record
struct Metadata {
  var title: String?
  var artist: String?
  var albumTitle: String?
  var artworkUrl: URL?
}

@Record
struct LockScreenOptions {
  var showSeekForward: Bool = false
  var showSeekBackward: Bool = false
  var showNextTrack: Bool = false
  var showPreviousTrack: Bool = false
  var isLiveStream: Bool? = false
  var seekForwardIntervalSeconds: Double = 10.0
  var seekBackwardIntervalSeconds: Double = 10.0
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

@Record
struct RecordOptions {
  var atTime: Double?
  var forDuration: Double?
}

enum AudioStreamEncoding: String, Enumerable {
  case float32
  case int16
}

@Record
struct AudioStreamOptions {
  var sampleRate: Double = 48000
  var channels: Int = 1
  var encoding: AudioStreamEncoding = .float32
}

enum AudioStreamFileFormat: String, Enumerable {
  case wav
  case pcm

  var fileExtension: String {
      rawValue
  }
}

@Record
struct AudioStreamFileRecordingOptions {
  var uri: URL?
  var directory: RecordingDirectory? = .cache
  var format: AudioStreamFileFormat = .wav
}

@Record
struct AudioStreamFileRecordingStartResult {
  var uri: String?
}

@Record
struct AudioStreamFileRecordingResult {
  var uri: String = ""
  var duration: Double = 0.0
  var size: Int = 0
  var sampleRate: Int = 0
  var channels: Int = 0
  var encoding: AudioStreamEncoding = .int16
}

@Record
struct AudioPlayerStatus {
  var id: String
  var currentTime: Double
  var playbackState: String
  var timeControlStatus: String
  var reasonForWaitingToPlay: String
  var mute: Bool
  var duration: Double
  var playing: Bool
  var loop: Bool
  var didJustFinish: Bool
  var isLoaded: Bool
  var playbackRate: Float
  var shouldCorrectPitch: Bool
  var isBuffering: Bool
  var isLive: Bool
  var currentOffsetFromLive: Double?
  var error: String?
  var mediaServicesDidReset: Bool
}

@Record
struct AudioSampleChannel {
  var frames: [Float]
}

@Record
struct AudioSampleEvent {
  var channels: [AudioSampleChannel]
  var timestamp: Double
}

@Record
struct AudioPlaylistStatus {
  var id: String
  var currentIndex: Int
  var trackCount: Int
  var currentTime: Double
  var duration: Double
  var playing: Bool
  var isBuffering: Bool
  var isLoaded: Bool
  var playbackRate: Float
  var muted: Bool
  var volume: Float
  var loop: LoopMode
  var didJustFinish: Bool
}

@Record
struct TrackChangedEvent {
  var previousIndex: Int
  var currentIndex: Int
}
