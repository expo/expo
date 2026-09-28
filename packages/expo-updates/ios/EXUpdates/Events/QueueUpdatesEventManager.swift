//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

internal class QueueUpdatesEventManager: UpdatesEventManager {
  private let logger: UpdatesLogger

  required init(logger: UpdatesLogger) {
    self.logger = logger
  }

  private struct State {
    weak var observer: (any UpdatesEventManagerObserver)?
  }
  private let state = Mutex(State())

  internal func setObserver(_ observer: UpdatesEventManagerObserver) {
    state.withLock { $0.observer = observer }
  }

  internal func removeObserver(_ observer: UpdatesEventManagerObserver) {
    state.withLock {
      if $0.observer === observer {
        $0.observer = nil
      }
    }
  }

  internal func sendStateMachineContextEvent(context: UpdatesStateContext) {
    logger.debug(message: "Sending state machine context to observer")
    guard let observer = state.withLock({ $0.observer }) else {
      logger.debug(message: "Unable to send state machine context to observer, no observer", code: .jsRuntimeError)
      return
    }
    observer.onStateMachineContextEvent(context: context)
    logger.debug(message: "Sent state machine context to observer")
  }
}
