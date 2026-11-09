import ExpoModulesCore
import Foundation
import os

private let interruptionEvent = "interruption"
private let routeChangeEvent = "routeChange"
private let activationErrorEvent = "activationError"
private let nowPlayingOwnerChangeEvent = "nowPlayingOwnerChange"

public class MediaSessionModule: Module {
  private let forwarder = EventForwarder()
  private let registration = OSAllocatedUnfairLock<ObserverRegistration?>(initialState: nil)
  private let holds = OSAllocatedUnfairLock<[String: SessionHold]>(initialState: [:])
  private let owners = OSAllocatedUnfairLock(uncheckedState: NSHashTable<JSNowPlayingOwner>.weakObjects())

  public func definition() -> ModuleDefinition {
    Name("ExpoMediaSession")

    Events(interruptionEvent, routeChangeEvent, activationErrorEvent, nowPlayingOwnerChangeEvent)

    OnCreate {
      self.forwarder.module = self
    }

    AsyncFunction("setAudioPolicyAsync") { (record: AudioPolicyRecord) in
      try MediaSessionManager.shared.setPolicy(record.update)
    }

    Function("getAudioPolicy") {
      AudioPolicyRecord(MediaSessionManager.shared.policy)
    }

    Function("holdSession") { (key: String) in
      let hold = MediaSessionManager.shared.hold(client: key)
      let previous = self.holds.withLockUnchecked { $0.updateValue(hold, forKey: key) }
      previous?.release()
    }

    Function("releaseSession") { (key: String) in
      let hold = self.holds.withLockUnchecked { $0.removeValue(forKey: key) }
      hold?.release()
    }

    Function("getNowPlayingOwnerId") {
      MediaSessionManager.shared.nowPlayingOwnerID
    }

    Class("NowPlayingOwner", JSNowPlayingOwner.self) {
      Constructor { (id: String, mediaType: String) in
        let owner = JSNowPlayingOwner(id: id, mediaType: NowPlayingMediaType(rawValue: mediaType))
        self.owners.withLockUnchecked { $0.add(owner) }
        return owner
      }

      Function("offer") { (owner: JSNowPlayingOwner, info: NowPlayingInfoRecord, commands: [String], isPlaying: Bool) in
        owner.offer(info: info.info, commands: Set(commands.map(RemoteCommandKind.init)), isPlaying: isPlaying)
      }

      Function("update") {
        (owner: JSNowPlayingOwner, info: NowPlayingInfoRecord, commands: [String]?, isPlaying: Bool) in
        let kinds = commands.map { Set($0.map(RemoteCommandKind.init)) }
        owner.update(info: info.info, commands: kinds, isPlaying: isPlaying)
      }

      Function("withdraw") { (owner: JSNowPlayingOwner, reason: String) in
        owner.withdraw(WithdrawReason(rawValue: reason))
      }
    }

    OnStartObserving {
      self.registration.withLockUnchecked { registration in
        if registration == nil {
          registration = MediaSessionManager.shared.addObserver(self.forwarder)
        }
      }
    }

    OnStopObserving {
      self.stopObserving()
    }

    OnDestroy {
      self.stopObserving()
      let released = self.holds.withLockUnchecked { holds in
        defer { holds = [:] }
        return holds
      }
      for hold in released.values {
        hold.release()
      }
      let owners = self.owners.withLockUnchecked { owners in
        defer { owners.removeAllObjects() }
        return owners.allObjects
      }
      for owner in owners {
        owner.withdraw(.released)
      }
    }
  }

  private func stopObserving() {
    let removed = registration.withLock { registration in
      defer { registration = nil }
      return registration
    }
    removed?.remove()
  }
}

struct AudioPolicyRecord: Record {
  @Field var playsInSilentMode: Bool?
  @Field var interruptionMode: InterruptionMode?
  @Field var allowsRecording: Bool?
  @Field var shouldPlayInBackground: Bool?
  @Field var shouldRouteThroughEarpiece: Bool?

  init() {}

  init(_ policy: AudioPolicy) {
    playsInSilentMode = policy.playsInSilentMode
    interruptionMode = policy.interruptionMode
    allowsRecording = policy.allowsRecording
    shouldPlayInBackground = policy.shouldPlayInBackground
    shouldRouteThroughEarpiece = policy.shouldRouteThroughEarpiece
  }

  var update: AudioPolicyUpdate {
    AudioPolicyUpdate(
      playsInSilentMode: playsInSilentMode,
      interruptionMode: interruptionMode,
      allowsRecording: allowsRecording,
      shouldPlayInBackground: shouldPlayInBackground,
      shouldRouteThroughEarpiece: shouldRouteThroughEarpiece
    )
  }
}

struct NowPlayingInfoRecord: Record {
  @Field var title: String?
  @Field var artist: String?
  @Field var album: String?
  @Field var artworkUrl: URL?
  @Field var duration: Double?
  @Field var elapsedTime: Double?
  @Field var playbackRate: Double?
  @Field var isLiveStream: Bool?
  @Field var queueIndex: Int?
  @Field var queueCount: Int?
  @Field var skipForwardInterval: Double?
  @Field var skipBackwardInterval: Double?

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

final class JSNowPlayingOwner: SharedObject, NowPlayingOwner {
  let nowPlayingID: String
  let mediaType: NowPlayingMediaType
  private let playing = OSAllocatedUnfairLock(initialState: false)
  private let claim = OSAllocatedUnfairLock<NowPlayingClaim?>(initialState: nil)

  init(id: String, mediaType: NowPlayingMediaType) {
    nowPlayingID = id
    self.mediaType = mediaType
  }

  var isPlaying: Bool {
    playing.withLock { $0 }
  }

  func offer(info: NowPlayingInfo, commands: Set<RemoteCommandKind>, isPlaying: Bool) {
    playing.withLock { $0 = isPlaying }
    let offered = MediaSessionManager.shared.offerNowPlaying(self, info: info, commands: commands)
    let previous = claim.withLockUnchecked { claim in
      defer { claim = offered }
      return claim
    }
    previous?.withdraw(.released)
  }

  func update(info: NowPlayingInfo, commands: Set<RemoteCommandKind>?, isPlaying: Bool) {
    playing.withLock { $0 = isPlaying }
    claim.withLockUnchecked { $0 }?.update(info, commands: commands)
  }

  func withdraw(_ reason: WithdrawReason) {
    let removed = claim.withLockUnchecked { claim in
      defer { claim = nil }
      return claim
    }
    removed?.withdraw(reason)
  }

  func handle(_ command: RemoteCommand) -> Bool {
    var payload: [String: Any] = ["kind": command.kind.rawValue]
    payload["value"] = command.value
    emit(event: "command", payload: payload)
    return true
  }

  override func sharedObjectDidRelease() {
    withdraw(.released)
  }

  func pauseForTakeover() {
    emit(event: "pauseForTakeover")
  }

  func resumeAfterTakeover() {
    emit(event: "resumeAfterTakeover")
  }
}

private final class EventForwarder: MediaSessionObserver {
  weak var module: MediaSessionModule?

  func mediaSessionInterruptionBegan(reason: InterruptionReason) {
    module?.sendEvent(interruptionEvent, ["type": "began", "reason": reason.rawValue])
  }

  func mediaSessionInterruptionEnded(shouldResume: Bool) {
    module?.sendEvent(interruptionEvent, ["type": "ended", "shouldResume": shouldResume])
  }

  func mediaSessionRouteChanged(reason: RouteChangeReason) {
    module?.sendEvent(routeChangeEvent, ["reason": reason.rawValue])
  }

  func mediaSession(didFail error: Error, client: String) {
    let message = (error as? Exception)?.description ?? error.localizedDescription
    module?.sendEvent(activationErrorEvent, ["message": message, "client": client])
  }

  func mediaSessionNowPlayingOwnerChanged(id: String?) {
    module?.sendEvent(nowPlayingOwnerChangeEvent, ["id": id as Any? ?? NSNull()])
  }
}
