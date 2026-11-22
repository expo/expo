import AVFoundation
import ExpoModulesCore

final class SessionCoordinator: @unchecked Sendable {
  static let releaseDelay: TimeInterval = 1

  struct Snapshot: Sendable {
    var useCount = 0
    var lastGood: ResolvedSession?
    var pendingActivationCount = 0
  }

  private struct Entry {
    let id: UInt64
    let client: String
    var requirements: SessionRequirements
    let activation: ActivationSignal?
    var droppedOptions: AVAudioSession.CategoryOptions = []
    var isRejected = false
  }

  // Only touched on the coordinator queue.
  private struct RegisteredObserver: @unchecked Sendable {
    let id: UInt64
    let observer: any MediaSessionObserver
  }

  private let backend: any SessionBackend
  private let scheduler: any Scheduler
  private let policyState = Mutex(AudioPolicy.default)
  private let nextID = Mutex(UInt64(0))
  private let releaseGeneration = Mutex(UInt64(0))
  private let snapshot = Mutex(Snapshot())

  private var entries: [Entry] = []
  private var suspendCount = 0
  private var appliedSession: ResolvedSession?
  private var pendingActivations: [ActivationSignal] = []
  private var isActive = false
  private var pendingRelease: (any ScheduledWork)?
  private var releaseTicket = 0
  private var observers: [RegisteredObserver] = []

  init(backend: any SessionBackend, scheduler: any Scheduler) {
    self.backend = backend
    self.scheduler = scheduler
  }

  var policy: AudioPolicy {
    policyState.withLock { $0 }
  }

  var useCount: Int {
    snapshot.withLock { $0.useCount }
  }

  var lastGood: ResolvedSession? {
    snapshot.withLock { $0.lastGood }
  }

  var pendingActivationCount: Int {
    snapshot.withLock { $0.pendingActivationCount }
  }

  func begin(client: String, requirements: SessionRequirements, activation: ActivationSignal) -> UInt64 {
    let id = nextID.withLock { value in
      value += 1
      return value
    }
    releaseGeneration.withLock { $0 &+= 1 }
    task { [self] in
      entries.append(Entry(id: id, client: client, requirements: requirements, activation: activation))
      reconcile(client: client, activating: true, activation: activation, entryID: id)
    }
    return id
  }

  func update(id: UInt64, requirements: SessionRequirements) {
    task { [self] in
      guard let index = entries.firstIndex(where: { $0.id == id }) else {
        return
      }
      entries[index].requirements = requirements
      entries[index].isRejected = false
      reconcile(client: entries[index].client, activating: false, activation: nil, entryID: id)
    }
  }

  func end(id: UInt64) {
    task { [self] in
      guard let index = entries.firstIndex(where: { $0.id == id }) else {
        return
      }
      let entry = entries.remove(at: index)
      pendingActivations.removeAll { $0 === entry.activation }
      if entries.isEmpty {
        scheduleRelease()
      } else {
        reconcile(client: nil, activating: false, activation: nil)
      }
    }
  }

  func setPolicy(_ update: AudioPolicyUpdate) throws {
    try policyState.withLock { policy in
      let merged = policy.merged(with: update)
      try merged.validate()
      policy = merged
    }
    task { [self] in
      reconcile(client: nil, activating: false, activation: nil)
    }
  }

  func suspendWrites(reason: String) {
    task { [self] in
      suspendCount += 1
      guard suspendCount == 1 else {
        return
      }
      cancelPendingRelease()
      notify { $0.mediaSessionDidSuspendWrites(reason: reason) }
    }
  }

  func resumeWrites() {
    task { [self] in
      guard suspendCount > 0 else {
        return
      }
      suspendCount -= 1
      guard suspendCount == 0 else {
        return
      }
      notify { $0.mediaSessionDidResumeWrites() }
      if entries.isEmpty {
        scheduleRelease()
      } else {
        isActive = false
        reconcile(client: nil, activating: true, activation: nil)
      }
    }
  }

  func addObserver(_ observer: any MediaSessionObserver) -> ObserverRegistration {
    let id = nextID.withLock { value in
      value += 1
      return value
    }
    let registered = RegisteredObserver(id: id, observer: observer)
    task { [self] in
      observers.append(registered)
    }
    return ObserverRegistration { [weak self] in
      self?.removeObserver(id: id)
    }
  }

  private func removeObserver(id: UInt64) {
    task { [self] in
      observers.removeAll { $0.id == id }
    }
  }

  private func task(_ body: @escaping @Sendable () -> Void) {
    scheduler.async { [self] in
      body()
      publishSnapshot()
    }
  }

  private func publishSnapshot() {
    let current = Snapshot(
      useCount: entries.count,
      lastGood: appliedSession,
      pendingActivationCount: pendingActivations.count
    )
    snapshot.withLock { $0 = current }
  }

  private func reconcile(client: String?, activating: Bool, activation: ActivationSignal?, entryID: UInt64? = nil) {
    scheduler.assertIsolated()
    if let activation {
      pendingActivations.append(activation)
    }
    guard suspendCount == 0, let reportedClient = client ?? entries.last?.client else {
      return
    }
    cancelPendingRelease()

    let resolved = resolveDroppingInapplicableOptions()
    do {
      try backend.configure(resolved)
      appliedSession = resolved
    } catch {
      appliedSession = Self.sessionInEffect(
        live: backend.liveConfiguration,
        attempted: resolved,
        previous: appliedSession
      )
      let configuration = resolved.configuration
      let exception = MediaSessionException(
        "The audio session could not be configured for \(reportedClient). iOS rejected category \(configuration.category.rawValue), mode \(configuration.mode.rawValue) or the preferred sample rate or IO buffer duration. Check the use's requirements and the audio policy"
      ).causedBy(error)
      if let entryID, let index = entries.firstIndex(where: { $0.id == entryID }) {
        reject(index: index, exception)
        reconcile(client: nil, activating: activating, activation: nil)
      } else {
        fail(exception, client: reportedClient)
      }
      return
    }

    if activating && !isActive {
      do {
        try backend.activate()
        isActive = true
      } catch {
        fail(
          MediaSessionException(
            "The audio session could not be activated for \(reportedClient). Another app or a phone call may hold a session that does not mix with others. Begin the use again after the interruption ends"
          ).causedBy(error),
          client: reportedClient
        )
        return
      }
    }
    completePending(.success(()))
  }

  static func sessionInEffect(
    live: SessionConfiguration,
    attempted: ResolvedSession,
    previous: ResolvedSession?
  ) -> ResolvedSession {
    if live == attempted.configuration {
      return attempted
    }
    if let previous, live == previous.configuration {
      return previous
    }
    let interruptionMode: InterruptionMode =
      live.options.contains(.duckOthers)
      ? .duckOthers : live.options.contains(.mixWithOthers) ? .mixWithOthers : .doNotMix
    return ResolvedSession(
      interruptionMode: interruptionMode,
      configuration: live,
      preferredSampleRate: nil,
      preferredIOBufferDuration: nil,
      notifiesOthersOnDeactivation: true
    )
  }

  private func completePending(_ result: Result<Void, Error>) {
    let waiting = pendingActivations
    pendingActivations = []
    for activation in waiting {
      activation.finish(result)
    }
  }

  private func resolveDroppingInapplicableOptions() -> ResolvedSession {
    let applicable = entries.filter { !$0.isRejected }.map(\.requirements)
    let resolved = SessionResolver.resolve(policy: policy, requirements: applicable)
    let category = resolved.configuration.category
    for index in entries.indices {
      let dropped = SessionResolver.unsupportedOptions(entries[index].requirements.extraOptions, in: category)
      let newlyDropped = dropped.subtracting(entries[index].droppedOptions)
      if !newlyDropped.isEmpty {
        print(
          "[expo-media-session] Ignoring extraOptions \(newlyDropped.rawValue) for \(entries[index].client): not valid in \(category.rawValue)"
        )
        entries[index].droppedOptions.formUnion(newlyDropped)
      }
    }
    return resolved
  }

  private func reject(index: Int, _ error: Error) {
    entries[index].isRejected = true
    if let activation = entries[index].activation {
      pendingActivations.removeAll { $0 === activation }
      activation.finish(.failure(error))
    }
    let client = entries[index].client
    notify { $0.mediaSession(didFail: error, client: client) }
  }

  private func fail(_ error: Error, client: String) {
    completePending(.failure(error))
    notify { $0.mediaSession(didFail: error, client: client) }
  }

  private func restorePolicyCategory() {
    let policyOnly = SessionResolver.resolve(policy: policy, requirements: [])
    guard suspendCount == 0, let appliedSession,
      appliedSession.configuration.category != policyOnly.configuration.category
    else {
      return
    }
    do {
      try backend.configure(policyOnly)
      self.appliedSession = policyOnly
    } catch {
      print("[expo-media-session] Failed to restore the audio session category: \(error.localizedDescription)")
    }
  }

  private func scheduleRelease() {
    guard suspendCount == 0 else {
      return
    }
    cancelPendingRelease()
    releaseTicket += 1
    let ticket = releaseTicket
    let generation = releaseGeneration.withLock { $0 }
    pendingRelease = scheduler.schedule(after: Self.releaseDelay) { [weak self] in
      self?.release(ticket: ticket, generation: generation)
    }
  }

  private func cancelPendingRelease() {
    pendingRelease?.cancel()
    pendingRelease = nil
  }

  private func release(ticket: Int, generation: UInt64) {
    scheduler.assertIsolated()
    defer { publishSnapshot() }
    guard ticket == releaseTicket else {
      return
    }
    pendingRelease = nil
    guard generation == releaseGeneration.withLock({ $0 }), entries.isEmpty, suspendCount == 0 else {
      return
    }
    let deactivates = isActive && appliedSession?.interruptionMode != .mixWithOthers
    restorePolicyCategory()
    guard deactivates else {
      return
    }
    do {
      try backend.deactivate(notifyingOthers: appliedSession?.notifiesOthersOnDeactivation ?? true)
      isActive = false
    } catch {
      // iOS deactivates the session before it throws isBusy.
      if (error as NSError).code == AVAudioSession.ErrorCode.isBusy.rawValue {
        isActive = false
      }
      print("[expo-media-session] Failed to deactivate the audio session: \(error.localizedDescription)")
    }
  }

  private func notify(_ body: (any MediaSessionObserver) -> Void) {
    scheduler.assertIsolated()
    publishSnapshot()
    for entry in observers {
      body(entry.observer)
    }
  }
}
