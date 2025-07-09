//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

internal class QueueUpdatesEventManager: UpdatesEventManager {
  private let logger: UpdatesLogger

  required init(logger: UpdatesLogger) {
    self.logger = logger
  }

  internal weak var observer: (any UpdatesEventManagerObserver)?

  internal func sendStateMachineContextEvent(context: UpdatesStateContext) {
    logger.debug(message: "Sending state machine context to observer")
    guard let observer = observer else {
      logger.debug(message: "Unable to send state machine context to observer, no observer", code: .jsRuntimeError)
      return
    }
    observer.onStateMachineContextEvent(context: context)
    logger.debug(message: "Sent state machine context to observer")
  }
}
