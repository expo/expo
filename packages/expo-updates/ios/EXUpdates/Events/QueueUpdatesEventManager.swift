//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

internal class QueueUpdatesEventManager: UpdatesEventManager {
  private let logger: UpdatesLogger

  required init(logger: UpdatesLogger) {
    self.logger = logger
  }

  internal weak var eventEmitter: EXEventEmitterService?

  internal func sendStateMachineContextEvent(context: UpdatesStateContext) {
    logger.info(message: "sendUpdateStateAppContext()")
    sendEventToAppContext(EXUpdatesStateChangeEventName, body: [
      "context": context.json
    ])
  }

  private func sendEventToAppContext(_ eventName: String, body: [String: Any?]) {
    guard let eventEmitter = eventEmitter else {
      logger.info(message: "EXUpdates: Could not emit event: name = \(eventName)", code: .jsRuntimeError)
      return
    }
    logger.debug(message: "sendEventToAppContext: \(eventName), \(body)")
    eventEmitter.sendEvent(withName: eventName, body: body)
  }
}
