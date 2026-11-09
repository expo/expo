import AVFoundation
import Foundation

@testable import ExpoMediaSession

final class ManualScheduler: Scheduler, @unchecked Sendable {
  private struct Timer {
    let id: Int
    let deadline: Int
    let work: @Sendable () -> Void
  }

  private struct Handle: ScheduledWork, Sendable {
    let cancelBody: @Sendable () -> Void

    func cancel() {
      cancelBody()
    }
  }

  private let lock = NSLock()
  private var ready: [@Sendable () -> Void] = []
  private var timers: [Timer] = []
  private var nextTimerID = 0
  private var isDraining = false
  private var nowMilliseconds = 0

  var now: TimeInterval {
    lock.withLock { TimeInterval(nowMilliseconds) / 1000 }
  }

  func async(_ work: @escaping @Sendable () -> Void) {
    lock.withLock { ready.append(work) }
    drain()
  }

  func schedule(after delay: TimeInterval, _ work: @escaping @Sendable () -> Void) -> any ScheduledWork {
    let id = lock.withLock {
      nextTimerID += 1
      timers.append(Timer(id: nextTimerID, deadline: nowMilliseconds + Int((delay * 1000).rounded()), work: work))
      return nextTimerID
    }
    return Handle { [weak self] in
      self?.lock.withLock { self?.timers.removeAll { $0.id == id } }
    }
  }

  func advance(milliseconds: Int) {
    let target = lock.withLock { nowMilliseconds + milliseconds }
    while let timer = nextTimer(dueBy: target) {
      async(timer.work)
    }
    lock.withLock { nowMilliseconds = target }
  }

  func enqueueDueTimers(advancingBy milliseconds: Int) {
    let target = lock.withLock { nowMilliseconds + milliseconds }
    while let timer = nextTimer(dueBy: target) {
      lock.withLock { ready.append(timer.work) }
    }
    lock.withLock { nowMilliseconds = target }
  }

  private func nextTimer(dueBy target: Int) -> Timer? {
    lock.withLock {
      guard let next = timers.filter({ $0.deadline <= target }).min(by: { ($0.deadline, $0.id) < ($1.deadline, $1.id) })
      else {
        return nil
      }
      timers.removeAll { $0.id == next.id }
      nowMilliseconds = next.deadline
      return next
    }
  }

  private func drain() {
    lock.lock()
    guard !isDraining else {
      lock.unlock()
      return
    }
    isDraining = true
    while !ready.isEmpty {
      let work = ready.removeFirst()
      lock.unlock()
      work()
      lock.lock()
    }
    isDraining = false
    lock.unlock()
  }
}

final class FakeSessionBackend: SessionBackend, @unchecked Sendable {
  enum Call: Equatable {
    case configure(ResolvedSession)
    case activate
    case deactivate(notifyingOthers: Bool)
  }

  private let lock = NSLock()
  private var recorded: [Call] = []
  private var lastGood: ResolvedSession?
  private var activateError: Error?
  private var configureError: Error?
  private var active = false
  private var deactivateErrors: [Error] = []
  private var rejectedSampleRate: Double?
  private var storedLive = SessionConfiguration(category: .soloAmbient)
  private var liveSampleRate: Double?
  private var liveIOBufferDuration: TimeInterval?
  private var onDeactivate: (@Sendable () -> Void)?

  var calls: [Call] {
    lock.withLock { recorded }
  }

  var configuration: ResolvedSession? {
    lock.withLock { lastGood }
  }

  var isActive: Bool {
    lock.withLock { active }
  }

  var liveConfiguration: SessionConfiguration {
    live
  }

  var live: SessionConfiguration {
    get { lock.withLock { storedLive } }
    set { lock.withLock { storedLive = newValue } }
  }

  func rejectSampleRate(_ rate: Double) {
    lock.withLock { rejectedSampleRate = rate }
  }

  func failActivation(with error: Error?) {
    lock.withLock { activateError = error }
  }

  func failConfiguration(with error: Error?) {
    lock.withLock { configureError = error }
  }

  func interrupt() {
    lock.withLock { active = false }
  }

  func failNextDeactivation(with error: Error) {
    lock.withLock { deactivateErrors.append(error) }
  }

  func resetMediaServices() {
    lock.withLock {
      storedLive = SessionConfiguration(category: .soloAmbient)
      active = false
      liveSampleRate = nil
      liveIOBufferDuration = nil
    }
  }

  func duringDeactivation(_ body: @escaping @Sendable () -> Void) {
    lock.withLock { onDeactivate = body }
  }

  func count(_ call: Call) -> Int {
    calls.filter { $0 == call }.count
  }

  func configure(_ session: ResolvedSession) throws -> Bool {
    let configuration = session.configuration
    let (isCurrent, rejectedRate) = lock.withLock {
      let isCurrent =
        storedLive == configuration
        && (session.preferredSampleRate == nil || session.preferredSampleRate == liveSampleRate)
        && (session.preferredIOBufferDuration == nil || session.preferredIOBufferDuration == liveIOBufferDuration)
      if !isCurrent {
        recorded.append(.configure(session))
      }
      return (isCurrent, rejectedSampleRate)
    }
    guard !isCurrent else {
      lock.withLock { lastGood = session }
      return false
    }
    if let error = lock.withLock({ configureError }) {
      throw error
    }
    if configuration.options.contains(.defaultToSpeaker) && configuration.category != .playAndRecord {
      throw NSError(domain: NSOSStatusErrorDomain, code: -50)
    }
    lock.withLock { storedLive = configuration }
    if let rejectedRate, session.preferredSampleRate == rejectedRate {
      throw NSError(domain: NSOSStatusErrorDomain, code: -50)
    }
    lock.withLock {
      liveSampleRate = session.preferredSampleRate ?? liveSampleRate
      liveIOBufferDuration = session.preferredIOBufferDuration ?? liveIOBufferDuration
      lastGood = session
    }
    return true
  }

  func activate() throws {
    let error = lock.withLock {
      recorded.append(.activate)
      return activateError
    }
    if let error {
      throw error
    }
    lock.withLock { active = true }
  }

  func deactivate(notifyingOthers: Bool) throws {
    let (hook, error) = lock.withLock {
      recorded.append(.deactivate(notifyingOthers: notifyingOthers))
      return (onDeactivate, deactivateErrors.isEmpty ? nil : deactivateErrors.removeFirst())
    }
    hook?()
    if let error {
      if (error as NSError).code == AVAudioSession.ErrorCode.isBusy.rawValue {
        lock.withLock { active = false }
      }
      throw error
    }
    lock.withLock { active = false }
  }
}

final class RecordingObserver: MediaSessionObserver, @unchecked Sendable {
  enum Event: Equatable {
    case failed(client: String)
    case suspended(reason: String)
    case resumed
    case interruptionBegan(InterruptionReason)
    case interruptionEnded(shouldResume: Bool)
    case routeChanged(RouteChangeReason)
    case ducked(Bool)
    case focusLost(transient: Bool)
    case servicesReset
    case silentModeChanged(isSilent: Bool)
    case nowPlayingOwnerChanged(String?)
  }

  private let lock = NSLock()
  private var recorded: [Event] = []
  private var lastError: Error?

  var events: [Event] {
    lock.withLock { recorded }
  }

  var error: Error? {
    lock.withLock { lastError }
  }

  func mediaSession(didFail error: Error, client: String) {
    lock.withLock {
      recorded.append(.failed(client: client))
      lastError = error
    }
  }

  func mediaSessionDidSuspendWrites(reason: String) {
    lock.withLock { recorded.append(.suspended(reason: reason)) }
  }

  func mediaSessionDidResumeWrites() {
    lock.withLock { recorded.append(.resumed) }
  }

  func mediaSessionInterruptionBegan(reason: InterruptionReason) {
    lock.withLock { recorded.append(.interruptionBegan(reason)) }
  }

  func mediaSessionInterruptionEnded(shouldResume: Bool) {
    lock.withLock { recorded.append(.interruptionEnded(shouldResume: shouldResume)) }
  }

  func mediaSessionRouteChanged(reason: RouteChangeReason) {
    lock.withLock { recorded.append(.routeChanged(reason)) }
  }

  func mediaSessionDucked(_ isDucked: Bool) {
    lock.withLock { recorded.append(.ducked(isDucked)) }
  }

  func mediaSessionFocusLost(transient: Bool) {
    lock.withLock { recorded.append(.focusLost(transient: transient)) }
  }

  func mediaSessionServicesReset() {
    lock.withLock { recorded.append(.servicesReset) }
  }

  func mediaSessionSilentModeChanged(isSilent: Bool) {
    lock.withLock { recorded.append(.silentModeChanged(isSilent: isSilent)) }
  }

  func mediaSessionNowPlayingOwnerChanged(id: String?) {
    lock.withLock { recorded.append(.nowPlayingOwnerChanged(id)) }
  }
}

final class Box<Value>: @unchecked Sendable where Value: Sendable {
  private let lock = NSLock()
  private var stored: Value

  init(_ value: Value) {
    stored = value
  }

  var value: Value {
    get { lock.withLock { stored } }
    set { lock.withLock { stored = newValue } }
  }

  func mutate(_ body: (inout Value) -> Void) {
    lock.withLock { body(&stored) }
  }
}

final class FakeNowPlayingCenter: NowPlayingCenterBackend, @unchecked Sendable {
  struct Load {
    let url: URL
    let completion: @Sendable (NowPlayingArtwork?) -> Void
  }

  private struct Handle: ScheduledWork {
    func cancel() {}
  }

  private let lock = NSLock()
  private var recorded: [NowPlayingCenterState?] = []
  private var handler: (@Sendable (RemoteCommand) -> Void)?
  private var startedLoads: [Load] = []

  var applied: [NowPlayingCenterState?] {
    lock.withLock { recorded }
  }

  var state: NowPlayingCenterState? {
    applied.last ?? nil
  }

  var nowPlayingInfo: [String: Any]? {
    state?.nowPlayingInfo
  }

  var targets: Set<RemoteCommandKind> {
    state?.commands ?? []
  }

  var loads: [Load] {
    lock.withLock { startedLoads }
  }

  func setCommandHandler(_ handler: @escaping @Sendable (RemoteCommand) -> Void) {
    lock.withLock { self.handler = handler }
  }

  func apply(_ state: NowPlayingCenterState?) {
    lock.withLock { recorded.append(state) }
  }

  func loadArtwork(from url: URL, completion: @escaping @Sendable (NowPlayingArtwork?) -> Void) -> any ScheduledWork {
    lock.withLock { startedLoads.append(Load(url: url, completion: completion)) }
    return Handle()
  }

  func send(_ command: RemoteCommand) {
    lock.withLock { handler }?(command)
  }
}

final class FakeNowPlayingOwner: NowPlayingOwner, @unchecked Sendable {
  enum Event: Equatable {
    case handled(RemoteCommand)
    case pausedForTakeover
    case resumedAfterTakeover
  }

  let nowPlayingID: String
  let mediaType: NowPlayingMediaType
  private let lock = NSLock()
  private var playing: Bool
  private var recorded: [Event] = []

  init(_ id: String, mediaType: NowPlayingMediaType = .audio, isPlaying: Bool = true) {
    nowPlayingID = id
    self.mediaType = mediaType
    playing = isPlaying
  }

  var isPlaying: Bool {
    get { lock.withLock { playing } }
    set { lock.withLock { playing = newValue } }
  }

  var events: [Event] {
    lock.withLock { recorded }
  }

  var handledCount: Int {
    events.filter {
      if case .handled = $0 {
        return true
      }
      return false
    }.count
  }

  func handle(_ command: RemoteCommand) -> Bool {
    lock.withLock {
      recorded.append(.handled(command))
      switch command.kind {
      case .play:
        playing = true
      case .pause:
        playing = false
      case .togglePlayPause:
        playing.toggle()
      default:
        break
      }
    }
    return true
  }

  func pauseForTakeover() {
    lock.withLock {
      recorded.append(.pausedForTakeover)
      playing = false
    }
  }

  func resumeAfterTakeover() {
    lock.withLock {
      recorded.append(.resumedAfterTakeover)
      playing = true
    }
  }
}
