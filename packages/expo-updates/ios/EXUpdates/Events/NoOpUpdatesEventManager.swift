//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

internal class NoOpUpdatesEventManager: UpdatesEventManager {
  func setObserver(_ observer: UpdatesEventManagerObserver) {}
  func removeObserver(_ observer: UpdatesEventManagerObserver) {}
  func sendStateMachineContextEvent(context: UpdatesStateContext) {}
}
