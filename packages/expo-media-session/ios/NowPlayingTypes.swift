import ExpoModulesCore
import Foundation

public struct NowPlayingMediaType: RawRepresentable, Hashable, Sendable {
  public let rawValue: String

  public init(rawValue: String) {
    self.rawValue = rawValue
  }

  public static let audio = NowPlayingMediaType(rawValue: "audio")
  public static let video = NowPlayingMediaType(rawValue: "video")
}

public struct RemoteCommandKind: RawRepresentable, Hashable, Sendable {
  public let rawValue: String

  public init(rawValue: String) {
    self.rawValue = rawValue
  }

  public static let play = RemoteCommandKind(rawValue: "play")
  public static let pause = RemoteCommandKind(rawValue: "pause")
  public static let togglePlayPause = RemoteCommandKind(rawValue: "togglePlayPause")
  public static let seek = RemoteCommandKind(rawValue: "seek")
  public static let skipForward = RemoteCommandKind(rawValue: "skipForward")
  public static let skipBackward = RemoteCommandKind(rawValue: "skipBackward")
  public static let nextTrack = RemoteCommandKind(rawValue: "nextTrack")
  public static let previousTrack = RemoteCommandKind(rawValue: "previousTrack")
}

public struct RemoteCommand: Hashable, Sendable {
  public var kind: RemoteCommandKind
  public var value: Double?

  public init(kind: RemoteCommandKind, value: Double? = nil) {
    self.kind = kind
    self.value = value
  }
}

public struct NowPlayingInfo: Equatable, Sendable {
  public var title: String?
  public var artist: String?
  public var album: String?
  public var artworkURL: URL?
  public var artworkData: Data?
  public var duration: Double?
  public var elapsedTime: Double?
  public var playbackRate: Double?
  public var isLiveStream: Bool
  public var queueIndex: Int?
  public var queueCount: Int?
  public var skipForwardInterval: Double?
  public var skipBackwardInterval: Double?

  public init(
    title: String? = nil,
    artist: String? = nil,
    album: String? = nil,
    artworkURL: URL? = nil,
    artworkData: Data? = nil,
    duration: Double? = nil,
    elapsedTime: Double? = nil,
    playbackRate: Double? = nil,
    isLiveStream: Bool = false,
    queueIndex: Int? = nil,
    queueCount: Int? = nil,
    skipForwardInterval: Double? = nil,
    skipBackwardInterval: Double? = nil
  ) {
    self.title = title
    self.artist = artist
    self.album = album
    self.artworkURL = artworkURL
    self.artworkData = artworkData
    self.duration = duration
    self.elapsedTime = elapsedTime
    self.playbackRate = playbackRate
    self.isLiveStream = isLiveStream
    self.queueIndex = queueIndex
    self.queueCount = queueCount
    self.skipForwardInterval = skipForwardInterval
    self.skipBackwardInterval = skipBackwardInterval
  }
}

/// Called on the coordinator queue.
public protocol NowPlayingOwner: AnyObject {
  var mediaType: NowPlayingMediaType { get }
  var isPlaying: Bool { get }
  func handle(_ command: RemoteCommand)
  func pauseForTakeover()
  func resumeAfterTakeover()
}

extension NowPlayingOwner {
  public func pauseForTakeover() {
    handle(RemoteCommand(kind: .pause))
  }

  public func resumeAfterTakeover() {
    handle(RemoteCommand(kind: .play))
  }
}

final class StackNowPlayingClaim: NowPlayingClaim, @unchecked Sendable {
  private let id: UInt64
  private weak var stack: NowPlayingStack?
  private let withdrawn = Mutex(false)

  init(id: UInt64, stack: NowPlayingStack) {
    self.id = id
    self.stack = stack
  }

  deinit {
    withdraw()
  }

  func update(_ info: NowPlayingInfo, commands: Set<RemoteCommandKind>?) {
    guard !withdrawn.withLock({ $0 }) else {
      return
    }
    stack?.update(id: id, info: info, commands: commands)
  }

  func withdraw() {
    let wasWithdrawn = withdrawn.withLock { withdrawn in
      defer { withdrawn = true }
      return withdrawn
    }
    if !wasWithdrawn {
      stack?.withdraw(id: id)
    }
  }
}
