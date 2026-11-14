import MediaPlayer
import UIKit
import os

final class NowPlayingArtwork: Equatable, Sendable {
  let image: UIImage

  init(image: UIImage) {
    self.image = image
  }

  static func == (lhs: NowPlayingArtwork, rhs: NowPlayingArtwork) -> Bool {
    lhs === rhs
  }
}

struct NowPlayingCenterState: Equatable, Sendable {
  var info: NowPlayingInfo
  var mediaType: NowPlayingMediaType
  var isPlaying: Bool
  var commands: Set<RemoteCommandKind>
  var artwork: NowPlayingArtwork?

  static let defaultSkipInterval = 10.0
  static let minimumSkipInterval = 0.1

  static func skipInterval(_ seconds: Double?) -> Double {
    guard let seconds, seconds.isFinite else {
      return defaultSkipInterval
    }
    return max(seconds, minimumSkipInterval)
  }

  var nowPlayingInfo: [String: Any] {
    var result: [String: Any] = [
      MPNowPlayingInfoPropertyMediaType:
        (mediaType == .video
        ? MPNowPlayingInfoMediaType.video : MPNowPlayingInfoMediaType.audio).rawValue,
      MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? info.playbackRate ?? 1 : 0,
      MPNowPlayingInfoPropertyIsLiveStream: info.isLiveStream,
    ]
    func set(_ key: String, _ value: Any?) {
      if let value {
        result[key] = value
      }
    }
    set(MPMediaItemPropertyTitle, info.title)
    set(MPMediaItemPropertyArtist, info.artist)
    set(MPMediaItemPropertyAlbumTitle, info.album)
    if !info.isLiveStream {
      set(MPMediaItemPropertyPlaybackDuration, info.duration)
      set(MPNowPlayingInfoPropertyElapsedPlaybackTime, info.elapsedTime)
    }
    set(MPNowPlayingInfoPropertyPlaybackQueueIndex, info.queueIndex)
    set(MPNowPlayingInfoPropertyPlaybackQueueCount, info.queueCount)
    if let artwork {
      set(MPMediaItemPropertyArtwork, MPMediaItemArtwork(boundsSize: artwork.image.size) { _ in artwork.image })
    }
    return result
  }
}

protocol NowPlayingCenterBackend: AnyObject, Sendable {
  func setCommandHandler(_ handler: @escaping @Sendable (RemoteCommand) -> Void)
  func apply(_ state: NowPlayingCenterState?)
  func loadArtwork(from url: URL, completion: @escaping @Sendable (NowPlayingArtwork?) -> Void) -> any ScheduledWork
}

extension URLSessionTask: ScheduledWork {}

final class MPNowPlayingCenterBackend: NowPlayingCenterBackend, @unchecked Sendable {
  private let handler = OSAllocatedUnfairLock<(@Sendable (RemoteCommand) -> Void)?>(initialState: nil)
  @MainActor private var targets: [RemoteCommandKind: (command: MPRemoteCommand, target: Any)] = [:]
  private let log: @Sendable (String) -> Void

  nonisolated init(log: @escaping @Sendable (String) -> Void = { print($0) }) {
    self.log = log
  }

  func setCommandHandler(_ handler: @escaping @Sendable (RemoteCommand) -> Void) {
    self.handler.withLock { $0 = handler }
  }

  func apply(_ state: NowPlayingCenterState?) {
    DispatchQueue.main.async { [self] in
      MainActor.assumeIsolated {
        applyOnMain(state)
      }
    }
  }

  func loadArtwork(from url: URL, completion: @escaping @Sendable (NowPlayingArtwork?) -> Void) -> any ScheduledWork {
    let task = URLSession.shared.dataTask(with: url) { [log] data, _, error in
      if (error as? URLError)?.code == .cancelled {
        return
      }
      if let error {
        log("[expo-media-session] Could not load the Now Playing artwork from \(url): \(error.localizedDescription)")
      }
      completion(data.flatMap(UIImage.init(data:)).map(NowPlayingArtwork.init(image:)))
    }
    task.resume()
    return task
  }

  @MainActor
  private func applyOnMain(_ state: NowPlayingCenterState?) {
    let center = MPRemoteCommandCenter.shared()
    let wanted = state?.commands ?? []
    for (kind, registered) in targets where !wanted.contains(kind) {
      registered.command.removeTarget(registered.target)
      targets[kind] = nil
    }
    for kind in wanted where targets[kind] == nil {
      guard let command = Self.command(for: kind, in: center) else {
        continue
      }
      let target = command.addTarget { [weak self] event in
        self?.send(kind, event) ?? .commandFailed
      }
      targets[kind] = (command, target)
    }
    for registered in targets.values {
      registered.command.isEnabled = true
    }
    if let state {
      center.skipForwardCommand.preferredIntervals = [
        NSNumber(value: NowPlayingCenterState.skipInterval(state.info.skipForwardInterval))
      ]
      center.skipBackwardCommand.preferredIntervals = [
        NSNumber(value: NowPlayingCenterState.skipInterval(state.info.skipBackwardInterval))
      ]
    }
    MPNowPlayingInfoCenter.default().nowPlayingInfo = state?.nowPlayingInfo
  }

  private func send(_ kind: RemoteCommandKind, _ event: MPRemoteCommandEvent) -> MPRemoteCommandHandlerStatus {
    guard let handler = handler.withLock({ $0 }) else {
      return .commandFailed
    }
    var value: Double?
    if let event = event as? MPChangePlaybackPositionCommandEvent {
      value = event.positionTime
    } else if let event = event as? MPSkipIntervalCommandEvent {
      value = event.interval
    }
    handler(RemoteCommand(kind: kind, value: value))
    return .success
  }

  private static func command(for kind: RemoteCommandKind, in center: MPRemoteCommandCenter) -> MPRemoteCommand? {
    switch kind {
    case .play:
      return center.playCommand
    case .pause:
      return center.pauseCommand
    case .togglePlayPause:
      return center.togglePlayPauseCommand
    case .seek:
      return center.changePlaybackPositionCommand
    case .skipForward:
      return center.skipForwardCommand
    case .skipBackward:
      return center.skipBackwardCommand
    case .nextTrack:
      return center.nextTrackCommand
    case .previousTrack:
      return center.previousTrackCommand
    default:
      return nil
    }
  }
}
