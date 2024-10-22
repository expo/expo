//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

public protocol UpdatesEventManager: AnyObject {
  var eventEmitter: EXEventEmitterService? { get set }
  func sendStateMachineContextEvent(context: UpdatesStateContext)
}
