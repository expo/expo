import AVFoundation
import ExpoModulesCore

final class SessionCoordinator: @unchecked Sendable {
  static let releaseDelay: TimeInterval = 1

  struct Snapshot: Sendable {
    var useCount = 0
    var lastGood: ResolvedSession?
    var pendingActivationCount = 0
  }

  enum PauseCause: Hashable {
    case interruption
    case background
  }

  // Only touched on the coordinator queue.
  struct WeakUse: @unchecked Sendable {
    weak var delegate: (any SessionUseDelegate)?
    weak var token: CoordinatorSessionUse?
    let queue: DispatchQueue
  }

  private struct Entry {
    let id: UInt64
    let client: String
    var requirements: SessionRequirements
    let activation: ActivationSignal?
    let use: WeakUse?
    var droppedOptions: AVAudioSession.CategoryOptions = []
    var isRejected = false
    var causes: Set<PauseCause> = []
    var isDucked = false

    var isCommanded: Bool {
      use != nil
    }
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
  private var correctedAfterNotification = false
  private var needsReactivation = false
  private var deferredInterruptionEnd: Bool?
  private var suppressedActivationError: Error?
  private(set) var isInterrupted = false
  private var isDuckingForInterruption = false

  private let log: @Sendable (String) -> Void

  init(
    backend: any SessionBackend,
    scheduler: any Scheduler,
    log: @escaping @Sendable (String) -> Void = { print($0) }
  ) {
    self.backend = backend
    self.scheduler = scheduler
    self.log = log
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

  // Coordinator queue only.
  var effectiveInterruptionMode: InterruptionMode {
    SessionResolver.resolve(policy: policy, requirements: entries.filter { !$0.isRejected }.map(\.requirements))
      .interruptionMode
  }

  func reserveID() -> UInt64 {
    nextID.withLock { value in
      value += 1
      return value
    }
  }

  func begin(
    id: UInt64,
    client: String,
    requirements: SessionRequirements,
    activation: ActivationSignal,
    delegate: (any SessionUseDelegate)?,
    queue: DispatchQueue,
    token: CoordinatorSessionUse?
  ) {
    releaseGeneration.withLock { $0 &+= 1 }
    let use = delegate.map { WeakUse(delegate: $0, token: token, queue: queue) }
    task { [self] in
      entries.append(Entry(id: id, client: client, requirements: requirements, activation: activation, use: use))
      let activated = reconcile(client: client, activating: true, activation: activation, entryID: id)
      // iOS does not always send the end of an interruption. A successful activation means it is over.
      if activated && suspendCount == 0 && isDuckingForInterruption {
        endDuck()
      }
    }
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
      if entries.isEmpty {
        applyPolicyOnly()
      } else {
        reconcile(client: nil, activating: false, activation: nil)
      }
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
      let resumed: Bool
      needsReactivation = true
      if entries.isEmpty {
        scheduleRelease()
        applyPolicyOnly()
        resumed = false
      } else if isInterrupted {
        resumed = false
      } else {
        resumed = reconcile(client: nil, activating: true, activation: nil)
      }
      if let shouldResume = deferredInterruptionEnd {
        deferredInterruptionEnd = nil
        finishInterruption(resumed: shouldResume && resumed)
      }
    }
  }

  func interruptionBegan(reason: InterruptionReason) {
    task { [self] in
      needsReactivation = true
      isInterrupted = true
      deferredInterruptionEnd = nil
      let ducks = effectiveInterruptionMode == .duckOthers
      isDuckingForInterruption = ducks
      notify { $0.mediaSessionInterruptionBegan(reason: reason) }
      for index in entries.indices where entries[index].isCommanded && entries[index].causes.isEmpty {
        if ducks {
          if !entries[index].isDucked {
            entries[index].isDucked = true
            command(entries[index]) { $0.sessionUse($1, duck: true) }
          }
        } else {
          entries[index].causes.insert(.interruption)
          command(entries[index]) { $0.sessionUse($1, pause: .interruption) }
        }
      }
    }
  }

  func interruptionEnded(shouldResume: Bool) {
    task { [self] in
      isInterrupted = false
      guard suspendCount == 0 else {
        deferredInterruptionEnd = shouldResume
        return
      }
      let reactivates = (shouldResume || !pendingActivations.isEmpty) && !entries.isEmpty
      let resumed = reactivates && reconcile(client: nil, activating: true, activation: nil) && shouldResume
      finishInterruption(resumed: resumed)
    }
  }

  func routeChanged(_ reason: RouteChangeReason) {
    task { [self] in
      if reason == .categoryChange {
        reconcile(client: nil, activating: false, activation: nil, fromNotification: true)
      }
      notify { $0.mediaSessionRouteChanged(reason: reason) }
      guard reason == .oldDeviceUnavailable else {
        return
      }
      let input: SessionCapabilities = [.record, .measurement]
      let unplugged = entries.filter { $0.isCommanded && $0.requirements.capabilities.isDisjoint(with: input) }
      for entry in unplugged {
        command(entry) { $0.sessionUse($1, pause: .outputDisconnected) }
      }
      endEntries(ids: unplugged.map(\.id), error: nil)
    }
  }

  func mediaServicesWereReset() {
    task { [self] in
      needsReactivation = true
      isInterrupted = false
      if entries.isEmpty {
        appliedSession = nil
        isActive = false
        applyPolicyOnly()
      }
      let reactivated = reconcile(client: nil, activating: true, activation: nil)
      notify { $0.mediaSessionServicesReset() }
      resolveInterruptionPauses(resumed: reactivated)
    }
  }

  func didEnterBackground() {
    task { [self] in
      for index in entries.indices
      where entries[index].isCommanded && !entries[index].requirements.continuesInBackground
        && !entries[index].causes.contains(.background)
      {
        let wasRunning = entries[index].causes.isEmpty
        entries[index].causes.insert(.background)
        if wasRunning {
          command(entries[index]) { $0.sessionUse($1, pause: .background) }
        }
      }
    }
  }

  // iOS deactivates the session of a suspended app without a notification.
  func willEnterForeground() {
    task { [self] in
      let awaitsReactivation = needsReactivation
      needsReactivation = true
      var resumable: [UInt64] = []
      for index in entries.indices where entries[index].causes.contains(.background) {
        entries[index].causes.remove(.background)
        if entries[index].causes.isEmpty {
          resumable.append(entries[index].id)
        }
      }
      guard !resumable.isEmpty else {
        if !awaitsReactivation {
          reconcile(client: nil, activating: true, activation: nil)
        }
        return
      }
      suppressedActivationError = nil
      if reconcile(client: nil, activating: true, activation: nil, reportsActivationFailure: false) {
        for entry in entries where resumable.contains(entry.id) {
          command(entry) { $0.sessionUseResume($1) }
        }
      } else if isInterrupted {
        for index in entries.indices where resumable.contains(entries[index].id) {
          entries[index].causes.insert(.interruption)
        }
      } else if let error = suppressedActivationError {
        let client = entries.first { resumable.contains($0.id) }?.client ?? ""
        fail(error, client: client)
        endEntries(ids: resumable, error: error)
      }
    }
  }

  private func finishInterruption(resumed: Bool) {
    notify { $0.mediaSessionInterruptionEnded(shouldResume: resumed) }
    resolveInterruptionPauses(resumed: resumed)
  }

  private func endDuck() {
    isDuckingForInterruption = false
    for index in entries.indices where entries[index].isDucked {
      entries[index].isDucked = false
      command(entries[index]) { $0.sessionUse($1, duck: false) }
    }
  }

  private func resolveInterruptionPauses(resumed: Bool) {
    endDuck()
    let interrupted = entries.filter { $0.isCommanded && $0.causes.contains(.interruption) }.map(\.id)
    guard resumed else {
      endEntries(ids: interrupted, error: nil)
      return
    }
    for index in entries.indices where interrupted.contains(entries[index].id) {
      entries[index].causes.remove(.interruption)
      if entries[index].causes.isEmpty {
        command(entries[index]) { $0.sessionUseResume($1) }
      }
    }
  }

  private func command(_ entry: Entry, _ body: @escaping @Sendable (any SessionUseDelegate, any SessionUse) -> Void) {
    guard let use = entry.use, use.delegate != nil, use.token != nil else {
      return
    }
    use.queue.async {
      guard let delegate = use.delegate, let token = use.token, token.acceptsCommands else {
        return
      }
      body(delegate, token)
    }
  }

  private func endEntries(ids: [UInt64], error: Error?, reconciles: Bool = true) {
    guard !ids.isEmpty else {
      return
    }
    var removed = false
    for id in ids {
      guard let index = entries.firstIndex(where: { $0.id == id }) else {
        continue
      }
      let entry = entries.remove(at: index)
      removed = true
      if let activation = entry.activation {
        pendingActivations.removeAll { $0 === activation }
        activation.finish(.failure(error ?? SessionUseEndedException(entry.client)))
      }
      entry.use?.token?.markEndedByCoordinator()
      if entry.isDucked {
        command(entry) { $0.sessionUse($1, duck: false) }
      }
      if let error {
        command(entry) { $0.sessionUse($1, didFail: error) }
      }
      command(entry) { $0.sessionUseDidEnd($1) }
    }
    guard removed, reconciles else {
      return
    }
    if entries.isEmpty {
      scheduleRelease()
    } else {
      task { [self] in
        reconcile(client: nil, activating: false, activation: nil)
      }
    }
  }

  func addObserver(_ observer: any MediaSessionObserver) -> any ObserverRegistration {
    let id = nextID.withLock { value in
      value += 1
      return value
    }
    let registered = RegisteredObserver(id: id, observer: observer)
    task { [self] in
      observers.append(registered)
    }
    return CoordinatorObserverRegistration { [weak self] in
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

  @discardableResult
  private func reconcile(
    client: String?,
    activating: Bool,
    activation: ActivationSignal?,
    entryID: UInt64? = nil,
    fromNotification: Bool = false,
    reportsActivationFailure: Bool = true
  ) -> Bool {
    scheduler.assertIsolated()
    if let activation {
      pendingActivations.append(activation)
    }
    guard suspendCount == 0, let reportedClient = client ?? entries.last?.client else {
      return true
    }
    guard !(fromNotification && correctedAfterNotification) else {
      return true
    }
    cancelPendingRelease()

    let resolved = resolveDroppingInapplicableOptions()
    do {
      let wrote = try backend.configure(resolved)
      correctedAfterNotification = fromNotification && wrote
      appliedSession = resolved
    } catch {
      correctedAfterNotification = fromNotification
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
        if entries.isEmpty {
          scheduleRelease()
          return false
        }
        return reconcile(client: nil, activating: activating, activation: nil)
      }
      fail(exception, client: reportedClient)
      return false
    }

    if activating && (!isActive || needsReactivation) {
      do {
        try backend.activate()
        isActive = true
        needsReactivation = false
      } catch {
        let exception = MediaSessionException(
          "The audio session could not be activated for \(reportedClient). Another app or a phone call may hold a session that does not mix with others. Begin the use again after the interruption ends"
        ).causedBy(error)
        guard reportsActivationFailure else {
          suppressedActivationError = exception
          return false
        }
        fail(exception, client: reportedClient)
        return false
      }
    }
    completePending(.success(()))
    return true
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
        log(
          "[expo-media-session] Ignoring extraOptions \(newlyDropped.rawValue) for \(entries[index].client): not valid in \(category.rawValue)"
        )
        entries[index].droppedOptions.formUnion(newlyDropped)
      }
    }
    return resolved
  }

  private func reject(index: Int, _ error: Error) {
    let client = entries[index].client
    guard !entries[index].isCommanded else {
      let id = entries[index].id
      notify { $0.mediaSession(didFail: error, client: client) }
      endEntries(ids: [id], error: error, reconciles: false)
      return
    }
    entries[index].isRejected = true
    if let activation = entries[index].activation {
      pendingActivations.removeAll { $0 === activation }
      activation.finish(.failure(error))
    }
    notify { $0.mediaSession(didFail: error, client: client) }
  }

  private func fail(_ error: Error, client: String) {
    let failing = entries.filter { entry in
      entry.isCommanded && pendingActivations.contains { $0 === entry.activation }
    }.map(\.id)
    completePending(.failure(error))
    notify { $0.mediaSession(didFail: error, client: client) }
    endEntries(ids: failing, error: error)
  }

  private func applyPolicyOnly() {
    guard suspendCount == 0 else {
      return
    }
    let policyOnly = SessionResolver.resolve(policy: policy, requirements: [])
    guard appliedSession?.configuration != policyOnly.configuration else {
      return
    }
    // A mixWithOthers session stays active when idle. Release it before a non-mixable category interrupts others.
    if pendingRelease == nil && isActive && policyOnly.interruptionMode != .mixWithOthers {
      deactivate()
    }
    do {
      _ = try backend.configure(policyOnly)
      appliedSession = policyOnly
    } catch {
      log("[expo-media-session] Failed to apply the audio policy: \(error.localizedDescription)")
    }
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
      log("[expo-media-session] Failed to restore the audio session category: \(error.localizedDescription)")
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
    if deactivates {
      deactivate()
    }
  }

  private func deactivate() {
    do {
      try backend.deactivate(notifyingOthers: appliedSession?.notifiesOthersOnDeactivation ?? true)
      isActive = false
    } catch {
      let code = (error as NSError).code
      // iOS deactivates the session before it throws isBusy.
      if code == AVAudioSession.ErrorCode.isBusy.rawValue {
        isActive = false
      }
      log("[expo-media-session] Failed to deactivate the audio session (\(code)): \(error.localizedDescription)")
    }
  }

  func notify(_ body: (any MediaSessionObserver) -> Void) {
    scheduler.assertIsolated()
    publishSnapshot()
    for entry in observers {
      body(entry.observer)
    }
  }
}
