package expo.modules.updates.events

import expo.modules.kotlin.events.EventEmitter
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateContext

class UpdatesEventManager(private val logger: UpdatesLogger) : IUpdatesEventManager {
  override var eventEmitter: EventEmitter? = null

  override fun sendStateMachineContextEvent(context: UpdatesStateContext) {
    val eventName = UpdatesJSEvent.StateChange.eventName

    val eventEmitter = eventEmitter
    if (eventEmitter == null) {
      logger.info(
        "Could not emit $eventName event; no event emitter was found.",
        UpdatesErrorCode.JSRuntimeError
      )
      return
    }

    try {
      eventEmitter.emit(eventName, context.writableMap)
      logger.info("Emitted event: name = $eventName")
    } catch (e: Exception) {
      logger.error(
        "Could not emit $eventName event",
        e,
        UpdatesErrorCode.JSRuntimeError
      )
    }
  }
}
