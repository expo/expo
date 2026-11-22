import ExpoModulesCore

@SharedObject("SessionUse")
final class JSSessionUse: SharedObject {
  private let use = Mutex<(any SessionUse)?>(nil)
  private let isEnded = Mutex(false)

  @Event
  var onPause: (SessionPauseEvent) -> Void

  @Event
  var onResume: () -> Void

  @Event
  var onDuck: (SessionDuckEvent) -> Void

  @Event
  var onFail: (SessionFailEvent) -> Void

  @Event
  var onEnded: () -> Void

  init(client: String, requirements: SessionRequirements, manager: any MediaSessionManaging) {
    super.init()
    let begun = manager.beginUse(client: client, requirements: requirements, delegate: self, queue: .main)
    use.withLock { $0 = begun }
  }

  @JS
  nonisolated func update(_ requirements: SessionRequirementsRecord) {
    use.withLock { $0 }?.update(requirements.requirements)
  }

  @JS
  nonisolated func end() {
    isEnded.withLock { $0 = true }
    takeUse()?.end()
  }

  override func sharedObjectDidRelease() {
    end()
  }

  private var isLive: Bool {
    !isEnded.withLock { $0 }
  }

  private func takeUse() -> (any SessionUse)? {
    use.withLock { use in
      defer { use = nil }
      return use
    }
  }
}

extension JSSessionUse: SessionUseDelegate {
  func sessionUse(_ use: any SessionUse, pause reason: SessionPauseReason) {
    if isLive {
      onPause(SessionPauseEvent(reason: reason.rawValue))
    }
  }

  func sessionUseResume(_ use: any SessionUse) {
    if isLive {
      onResume()
    }
  }

  func sessionUse(_ use: any SessionUse, duck isDucked: Bool) {
    if isLive {
      onDuck(SessionDuckEvent(isDucked: isDucked))
    }
  }

  func sessionUse(_ use: any SessionUse, didFail error: Error) {
    if isLive {
      let message = (error as? Exception)?.description ?? error.localizedDescription
      onFail(SessionFailEvent(message: message))
    }
  }

  func sessionUseDidEnd(_ use: any SessionUse) {
    let wasLive = isEnded.withLock { isEnded in
      defer { isEnded = true }
      return !isEnded
    }
    _ = takeUse()
    if wasLive {
      onEnded()
    }
  }
}
