import Foundation
import os

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

public struct WithdrawReason: RawRepresentable, Hashable, Sendable {
  public let rawValue: String

  public init(rawValue: String) {
    self.rawValue = rawValue
  }

  public static let ended = WithdrawReason(rawValue: "ended")
  public static let released = WithdrawReason(rawValue: "released")
}

public struct NowPlayingInfo: Equatable, Sendable {
  public var title: String?
  public var artist: String?
  public var album: String?
  public var artworkURL: URL?
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
  var nowPlayingID: String { get }
  var mediaType: NowPlayingMediaType { get }
  var isPlaying: Bool { get }
  func handle(_ command: RemoteCommand) -> Bool
  func pauseForTakeover()
  func resumeAfterTakeover()
}

extension NowPlayingOwner {
  public func pauseForTakeover() {
    _ = handle(RemoteCommand(kind: .pause))
  }

  public func resumeAfterTakeover() {
    _ = handle(RemoteCommand(kind: .play))
  }
}

/// Store the claim while the owner shows on the lock screen. Deinit withdraws it as `released`.
public final class NowPlayingClaim: @unchecked Sendable {
  private let id: UInt64
  private weak var stack: NowPlayingStack?
  private let withdrawn = OSAllocatedUnfairLock(initialState: false)

  init(id: UInt64, stack: NowPlayingStack) {
    self.id = id
    self.stack = stack
  }

  deinit {
    withdraw(.released)
  }

  public func update(_ info: NowPlayingInfo, commands: Set<RemoteCommandKind>? = nil) {
    guard !withdrawn.withLock({ $0 }) else {
      return
    }
    stack?.update(id: id, info: info, commands: commands)
  }

  public func withdraw(_ reason: WithdrawReason) {
    let wasWithdrawn = withdrawn.withLock { withdrawn in
      defer { withdrawn = true }
      return withdrawn
    }
    if !wasWithdrawn {
      stack?.withdraw(id: id, reason: reason)
    }
  }
}

final class NowPlayingStack: @unchecked Sendable {
  private struct Entry {
    let claimID: UInt64
    let ownerID: ObjectIdentifier
    weak var owner: (any NowPlayingOwner)?
    var info: NowPlayingInfo
    var commands: Set<RemoteCommandKind>
    var pausedByTakeover = false
    var wasPlaying: Bool
    var playingSince: TimeInterval?
  }

  private struct PendingOwner: @unchecked Sendable {
    let owner: any NowPlayingOwner
  }

  private struct ArtworkLoad {
    let url: URL
    let ownerID: ObjectIdentifier
    let work: any ScheduledWork
  }

  private let center: any NowPlayingCenterBackend
  private let scheduler: any Scheduler
  private let mixingMode: () -> InterruptionMode
  private let onOwnerChange: (String?) -> Void
  private let nextID = OSAllocatedUnfairLock(initialState: UInt64(0))
  private let topID = OSAllocatedUnfairLock<String?>(initialState: nil)

  private var entries: [Entry] = []
  private var applied: NowPlayingCenterState?
  private var artwork: (url: URL, artwork: NowPlayingArtwork)?
  private var artworkLoad: ArtworkLoad?
  private var failedArtwork: (url: URL, ownerID: ObjectIdentifier)?

  init(
    center: any NowPlayingCenterBackend,
    scheduler: any Scheduler,
    mixingMode: @escaping () -> InterruptionMode,
    onOwnerChange: @escaping (String?) -> Void
  ) {
    self.center = center
    self.scheduler = scheduler
    self.mixingMode = mixingMode
    self.onOwnerChange = onOwnerChange
    center.setCommandHandler { [weak self] command in
      self?.scheduler.async { [weak self] in
        self?.route(command)
      }
    }
  }

  var ownerID: String? {
    topID.withLock { $0 }
  }

  func offer(_ owner: any NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>) -> NowPlayingClaim {
    let id = nextID.withLock { value in
      value += 1
      return value
    }
    let pending = PendingOwner(owner: owner)
    scheduler.async { [self] in
      push(pending.owner, claimID: id, info: info, commands: commands)
    }
    return NowPlayingClaim(id: id, stack: self)
  }

  func update(id: UInt64, info: NowPlayingInfo, commands: Set<RemoteCommandKind>?) {
    scheduler.async { [self] in
      settleTop()
      guard let index = entries.firstIndex(where: { $0.claimID == id }) else {
        return
      }
      entries[index].info = info
      if let commands {
        entries[index].commands = commands
      }
      let isPlaying = entries[index].owner?.isPlaying ?? false
      if isPlaying && !entries[index].wasPlaying {
        entries[index].pausedByTakeover = false
      }
      entries[index].wasPlaying = isPlaying
      entries[index].playingSince = isPlaying && !entries[index].pausedByTakeover ? scheduler.now : nil
      if index == entries.count - 1 {
        publish(force: true)
      }
    }
  }

  func withdraw(id: UInt64, reason: WithdrawReason) {
    scheduler.async { [self] in
      entries.removeAll { $0.claimID == id }
      settleTop()
      publish()
    }
  }

  private func push(
    _ owner: any NowPlayingOwner,
    claimID: UInt64,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>
  ) {
    settleTop()
    let ownerID = ObjectIdentifier(owner)
    if let top = entries.last, top.ownerID != ownerID, let previous = top.owner, previous.isPlaying,
      mixingMode() != .mixWithOthers
    {
      entries[entries.count - 1].pausedByTakeover = true
      entries[entries.count - 1].playingSince = nil
      previous.pauseForTakeover()
    }
    entries.removeAll { $0.ownerID == ownerID }
    if failedArtwork?.ownerID == ownerID {
      failedArtwork = nil
    }
    let isPlaying = owner.isPlaying
    entries.append(
      Entry(
        claimID: claimID,
        ownerID: ownerID,
        owner: owner,
        info: info,
        commands: commands,
        wasPlaying: isPlaying,
        playingSince: isPlaying ? scheduler.now : nil
      )
    )
    publish()
  }

  private func route(_ command: RemoteCommand) {
    settleTop()
    publish()
    guard let top = entries.last, let owner = top.owner, Self.commands(of: top).contains(command.kind) else {
      return
    }
    _ = owner.handle(command)
  }

  private func settleTop() {
    entries.removeAll { $0.owner == nil }
    guard let top = entries.last, top.pausedByTakeover, let owner = top.owner else {
      return
    }
    entries[entries.count - 1].pausedByTakeover = false
    owner.resumeAfterTakeover()
  }

  private func publish(force: Bool = false) {
    let top = entries.last
    let owner = top?.owner
    let id = owner?.nowPlayingID
    let previousID = topID.withLock { current in
      defer { current = id }
      return current
    }
    if previousID != id {
      onOwnerChange(id)
    }

    var state: NowPlayingCenterState?
    var written: NowPlayingCenterState?
    if let top, let owner {
      state = NowPlayingCenterState(
        info: top.info,
        mediaType: owner.mediaType,
        isPlaying: owner.isPlaying,
        commands: Self.commands(of: top),
        artwork: artwork(for: top)
      )
      written = state
      if state?.isPlaying == true, !top.info.isLiveStream, let since = top.playingSince,
        let elapsedTime = top.info.elapsedTime
      {
        written?.info.elapsedTime = elapsedTime + (scheduler.now - since) * (top.info.playbackRate ?? 1)
      }
    } else {
      artworkLoad?.work.cancel()
      artworkLoad = nil
      artwork = nil
    }
    if force || state != applied {
      applied = state
      center.apply(written)
    }
  }

  private func artwork(for top: Entry) -> NowPlayingArtwork? {
    guard let url = top.info.artworkURL else {
      artworkLoad?.work.cancel()
      artworkLoad = nil
      artwork = nil
      return nil
    }
    if let artwork, artwork.url == url {
      return artwork.artwork
    }
    artwork = nil
    if let failedArtwork, failedArtwork.url == url, failedArtwork.ownerID == top.ownerID {
      return nil
    }
    failedArtwork = nil
    if artworkLoad?.url != url || artworkLoad?.ownerID != top.ownerID {
      artworkLoad?.work.cancel()
      let ownerID = top.ownerID
      let work = center.loadArtwork(from: url) { [weak self] loaded in
        self?.scheduler.async { [weak self] in
          self?.artworkLoaded(loaded, url: url, ownerID: ownerID)
        }
      }
      artworkLoad = ArtworkLoad(url: url, ownerID: ownerID, work: work)
    }
    return nil
  }

  private func artworkLoaded(_ loaded: NowPlayingArtwork?, url: URL, ownerID: ObjectIdentifier) {
    guard let load = artworkLoad, load.url == url, load.ownerID == ownerID else {
      return
    }
    artworkLoad = nil
    guard let loaded else {
      failedArtwork = (url, ownerID)
      return
    }
    guard let top = entries.last, top.ownerID == ownerID, top.info.artworkURL == url else {
      return
    }
    artwork = (url, loaded)
    publish()
  }

  private static func commands(of entry: Entry) -> Set<RemoteCommandKind> {
    entry.info.isLiveStream ? entry.commands.subtracting([.seek]) : entry.commands
  }
}
