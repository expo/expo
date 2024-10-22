//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

public protocol UpdatesEventManagerObserver: AnyObject {
  func onStateMachineContextEvent(context: UpdatesStateContext)
}

public protocol UpdatesEventManager: AnyObject {
  var observer: UpdatesEventManagerObserver? { get set }
  func sendStateMachineContextEvent(context: UpdatesStateContext)
}
