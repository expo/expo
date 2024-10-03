//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

internal class NoOpUpdatesEventManager: UpdatesEventManager {
  internal weak var appContext: AppContext?
  internal var shouldEmitJsEvents: Bool = false

  internal func sendUpdateStateChangeEventToAppContext(_ eventType: UpdatesStateEventType, context: UpdatesStateContext) {}
}
