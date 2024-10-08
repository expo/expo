//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

public protocol UpdatesEventManager: AnyObject {
  /**
   The AppContext from expo-modules-core.
   This is optional, but required for expo-updates module events to work.
   */
  var appContext: AppContext? { get set }
  var shouldEmitJsEvents: Bool { get set }

  func sendUpdateStateChangeEventToAppContext(_ eventType: UpdatesStateEventType, context: UpdatesStateContext)
}
