import ExpoModulesCore
import Foundation

@Record
struct InterruptionEvent {
  var type: String
  var reason: String?
  var shouldResume: Bool?
}

@Record
struct RouteChangeEvent {
  var reason: String
}

@Record
struct ActivationErrorEvent {
  var message: String
  var client: String
}

@Record
struct AudioPolicyRecord {
  var playsInSilentMode: Bool?
  var interruptionMode: InterruptionMode?
  var allowsRecording: Bool?
  var shouldRouteThroughEarpiece: Bool?
  var bluetoothProfile: BluetoothProfile?
}

extension AudioPolicyRecord {
  init(_ policy: AudioPolicy) {
    self.init(
      playsInSilentMode: policy.playsInSilentMode,
      interruptionMode: policy.interruptionMode,
      allowsRecording: policy.allowsRecording,
      shouldRouteThroughEarpiece: policy.shouldRouteThroughEarpiece,
      bluetoothProfile: policy.bluetoothProfile
    )
  }

  var update: AudioPolicyUpdate {
    AudioPolicyUpdate(
      playsInSilentMode: playsInSilentMode,
      interruptionMode: interruptionMode,
      allowsRecording: allowsRecording,
      shouldRouteThroughEarpiece: shouldRouteThroughEarpiece,
      bluetoothProfile: bluetoothProfile
    )
  }
}

@Record
struct NowPlayingInfoRecord {
  var title: String?
  var artist: String?
  var album: String?
  var artworkUrl: URL?
  var duration: Double?
  var elapsedTime: Double?
  var playbackRate: Double?
  var isLiveStream: Bool?
  var queueIndex: Int?
  var queueCount: Int?
  var skipForwardInterval: Double?
  var skipBackwardInterval: Double?
}

extension NowPlayingInfoRecord {
  var info: NowPlayingInfo {
    NowPlayingInfo(
      title: title,
      artist: artist,
      album: album,
      artworkURL: artworkUrl,
      duration: duration,
      elapsedTime: elapsedTime,
      playbackRate: playbackRate,
      isLiveStream: isLiveStream ?? false,
      queueIndex: queueIndex,
      queueCount: queueCount,
      skipForwardInterval: skipForwardInterval,
      skipBackwardInterval: skipBackwardInterval
    )
  }
}

@Record
struct RemoteCommandEvent {
  var kind: String
  var value: Double?
}
