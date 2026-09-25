//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

public protocol UpdatesEventManagerObserver: AnyObject {
  func onStateMachineContextEvent(context: UpdatesStateContext)
}

public protocol UpdatesEventManager: AnyObject {
  func setObserver(_ observer: UpdatesEventManagerObserver)
  func removeObserver(_ observer: UpdatesEventManagerObserver)
  func sendStateMachineContextEvent(context: UpdatesStateContext)
}
