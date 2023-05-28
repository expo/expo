//  Copyright © 2023 650 Industries. All rights reserved.

import Foundation

public class UpdatesState {
  internal var appController: AppController?
  private let logger = UpdatesLogger()

  public func handleEvent(_ type: String, body: [String: Any] = [:]) {
    if type == AppController.UpdateAvailableEventName ||
      type == AppController.NoUpdateAvailableEventName ||
      type == AppController.ErrorEventName {
      // For the three legacy UpdateEvent types, we send the events to JS
      appController?.sendEventToBridge(type, body: body)
    } else {
      // TODO: use these events to construct the state
      // For now, log the other events
      logger.info(message: "Updates state change event \(type), body = \(body)")
    }
  }
}
