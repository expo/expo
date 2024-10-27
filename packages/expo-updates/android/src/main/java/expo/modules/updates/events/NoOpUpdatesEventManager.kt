package expo.modules.updates.events

import expo.modules.kotlin.events.EventEmitter
import expo.modules.updates.statemachine.UpdatesStateContext

class NoOpUpdatesEventManager : IUpdatesEventManager {
  override var eventEmitter: EventEmitter? = null
  override fun sendStateMachineContextEvent(context: UpdatesStateContext) {}
}
