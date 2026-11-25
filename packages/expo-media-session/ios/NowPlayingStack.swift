import ExpoModulesCore
import Foundation
import UIKit

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

  private enum ArtworkSource: Equatable {
    case url(URL)
    case data(Data)
  }

  private struct ArtworkLoad {
    let url: URL
    let ownerID: ObjectIdentifier
    let work: any ScheduledWork
  }

  private let center: any NowPlayingCenterBackend
  private let scheduler: any Scheduler
  private let mixingMode: () -> InterruptionMode
  private let isInterrupted: () -> Bool
  private struct Top {
    weak var owner: (any NowPlayingOwner)?
    var ownerID: ObjectIdentifier?
  }

  private let onOwnerChange: ((any NowPlayingOwner)?) -> Void
  private let nextID = Mutex(UInt64(0))
  private let published = Mutex(Top())

  private var entries: [Entry] = []
  private var applied: NowPlayingCenterState?
  private var artwork: (source: ArtworkSource, artwork: NowPlayingArtwork)?
  private var artworkLoad: ArtworkLoad?
  private var failedArtwork: (url: URL, ownerID: ObjectIdentifier)?

  init(
    center: any NowPlayingCenterBackend,
    scheduler: any Scheduler,
    mixingMode: @escaping () -> InterruptionMode,
    isInterrupted: @escaping () -> Bool = { false },
    onOwnerChange: @escaping ((any NowPlayingOwner)?) -> Void
  ) {
    self.center = center
    self.scheduler = scheduler
    self.mixingMode = mixingMode
    self.isInterrupted = isInterrupted
    self.onOwnerChange = onOwnerChange
    center.setCommandHandler { [weak self] command in
      self?.scheduler.async { [weak self] in
        self?.route(command)
      }
    }
  }

  var owner: (any NowPlayingOwner)? {
    published.withLock { $0.owner }
  }

  func offer(
    _ owner: any NowPlayingOwner,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>
  ) -> StackNowPlayingClaim {
    let id = nextID.withLock { value in
      value += 1
      return value
    }
    let pending = PendingOwner(owner: owner)
    scheduler.async { [self] in
      push(pending.owner, claimID: id, info: info, commands: commands)
    }
    return StackNowPlayingClaim(id: id, stack: self)
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
      let startedPlaying = isPlaying && !entries[index].wasPlaying
      if startedPlaying {
        entries[index].pausedByTakeover = false
      }
      entries[index].wasPlaying = isPlaying
      entries[index].playingSince = isPlaying && !entries[index].pausedByTakeover ? scheduler.now : nil
      if startedPlaying && index != entries.count - 1 {
        let entry = entries.remove(at: index)
        pauseTopForTakeover()
        entries.append(entry)
        publish(force: true)
      } else if index == entries.count - 1 {
        publish(force: true)
      }
    }
  }

  func withdraw(id: UInt64) {
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
    let isPlaying = owner.isPlaying
    let topPlays = entries.last.map { $0.ownerID != ownerID && $0.owner?.isPlaying == true } ?? false
    if isPlaying && topPlays {
      pauseTopForTakeover()
    }
    entries.removeAll { $0.ownerID == ownerID }
    if failedArtwork?.ownerID == ownerID {
      failedArtwork = nil
    }
    let entry = Entry(
      claimID: claimID,
      ownerID: ownerID,
      owner: owner,
      info: info,
      commands: commands,
      wasPlaying: isPlaying,
      playingSince: isPlaying ? scheduler.now : nil
    )
    if !isPlaying && topPlays {
      var position = entries.count - 1
      while position > 0 && entries[position - 1].pausedByTakeover {
        position -= 1
      }
      entries.insert(entry, at: position)
    } else {
      entries.append(entry)
    }
    publish()
  }

  private func pauseTopForTakeover() {
    guard let previous = entries.last?.owner, previous.isPlaying, mixingMode() != .mixWithOthers else {
      return
    }
    entries[entries.count - 1].pausedByTakeover = true
    entries[entries.count - 1].playingSince = nil
    entries[entries.count - 1].wasPlaying = true
    previous.pauseForTakeover()
  }

  private func route(_ command: RemoteCommand) {
    settleTop()
    publish()
    guard let top = entries.last, let owner = top.owner, Self.commands(of: top).contains(command.kind) else {
      return
    }
    owner.handle(command)
  }

  // Coordinator queue only.
  func interruptionEnded(shouldResume: Bool) {
    guard entries.last?.pausedByTakeover == true else {
      return
    }
    if shouldResume {
      settleTop()
    } else {
      entries[entries.count - 1].pausedByTakeover = false
    }
  }

  // Coordinator queue only.
  func servicesReset() {
    applied = nil
    center.reset()
    publish(force: true)
  }

  private func settleTop() {
    entries.removeAll { $0.owner == nil }
    guard let top = entries.last, top.pausedByTakeover, let owner = top.owner, !isInterrupted() else {
      return
    }
    entries[entries.count - 1].pausedByTakeover = false
    owner.resumeAfterTakeover()
  }

  private func publish(force: Bool = false) {
    let top = entries.last
    let owner = top?.owner
    let ownerID = owner.map(ObjectIdentifier.init)
    let changed = published.withLock { current in
      defer { current = Top(owner: owner, ownerID: ownerID) }
      return current.ownerID != ownerID
    }
    if changed {
      onOwnerChange(owner)
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
      return artwork(from: top.info.artworkData)
    }
    if let artwork, artwork.source == .url(url) {
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
    artwork = (.url(url), loaded)
    publish()
  }

  private func artwork(from data: Data?) -> NowPlayingArtwork? {
    guard let data else {
      artwork = nil
      return nil
    }
    if let artwork, artwork.source == .data(data) {
      return artwork.artwork
    }
    let decoded = UIImage(data: data).map(NowPlayingArtwork.init(image:))
    artwork = decoded.map { (.data(data), $0) }
    return decoded
  }

  private static func commands(of entry: Entry) -> Set<RemoteCommandKind> {
    entry.info.isLiveStream ? entry.commands.subtracting([.seek]) : entry.commands
  }
}
