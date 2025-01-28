//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

internal class NoOpUpdatesEventManager: UpdatesEventManager {
  internal weak var observer: (any UpdatesEventManagerObserver)?
  func sendStateMachineContextEvent(context: UpdatesStateContext) {}
}
