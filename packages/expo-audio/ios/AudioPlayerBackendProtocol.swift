import AVFoundation
import ExpoModulesCore

protocol AudioPlayerBackendProtocol: AnyObject {
  var id: String { get }
  var shouldCorrectPitch: Bool { get set }
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm { get set }
  var currentRate: Float { get set }
  var isPaused: Bool { get }
  var samplingEnabled: Bool { get set }
  var isLooping: Bool { get set }
  var volume: Float { get set }
  var isMuted: Bool { get set }

  var duration: Double { get }
  var currentTime: Double { get }
  var isLive: Bool { get }
  var currentOffsetFromLive: Double? { get }
  var isLoaded: Bool { get }
  var isPlaying: Bool { get }
  var isBuffering: Bool { get }

  var onPlaybackComplete: (() -> Void)? { get set }
  var onStatusUpdate: (([String: Any]) -> Void)? { get set }
  var onAudioSample: (([String: Any]) -> Void)? { get set }
  var lockScreenPlayer: AVPlayer? { get }

  func play(at rate: Float)
  func pause()
  func resumePlayback()
  func seekTo(seconds: Double, toleranceMillisBefore: Double?, toleranceMillisAfter: Double?) async
  func replaceCurrentSource(source: AudioSource)
  func currentStatus() -> [String: Any]
  func teardown()
}
