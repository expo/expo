package expo.modules.updates.events

import expo.modules.kotlin.events.EventEmitter
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEventType

class NoOpUpdatesEventManager : IUpdatesEventManager {
  override var eventEmitter: EventEmitter? = null
  override var shouldEmitJsEvents: Boolean = false
  override fun sendStateChangeEvent(
    eventType: UpdatesStateEventType,
    context: UpdatesStateContext
  ) {}
}
