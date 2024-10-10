package expo.modules.updates.events

import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.events.EventEmitter
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEventType

class QueueUpdatesEventManager(private val logger: UpdatesLogger) : IUpdatesEventManager {
  override var eventEmitter: EventEmitter? = null
  override var shouldEmitJsEvents: Boolean = false
    set(value) {
      field = value
      if (value) {
        sendQueuedEventsToEventEmitter()
      }
    }

  @get:Synchronized @set:Synchronized
  private var eventsToSendToJS = mutableListOf<Pair<String, WritableMap>>()

  override fun sendStateChangeEvent(
    eventType: UpdatesStateEventType,
    context: UpdatesStateContext
  ) {
    val eventName = UpdatesJSEvent.StateChange.eventName
    val params = context.writableMap.apply {
      putString("type", eventType.type)
    }

    if (!shouldEmitJsEvents) {
      eventsToSendToJS.add(Pair(eventName, params))
      logger.error(
        "Could not emit $eventName ${eventType.type} event; no subscribers registered.",
        UpdatesErrorCode.JSRuntimeError
      )
      return
    }

    val eventEmitter = eventEmitter
    if (eventEmitter == null) {
      eventsToSendToJS.add(Pair(eventName, params))
      logger.error(
        "Could not emit $eventName ${eventType.type} event; no event emitter was found.",
        UpdatesErrorCode.JSRuntimeError
      )
      return
    }

    try {
      eventEmitter.emit(eventName, params)
      logger.info("Emitted event: name = $eventName, type = $eventType")
    } catch (e: Exception) {
      eventsToSendToJS.add(Pair(eventName, params))
      logger.error(
        "Could not emit $eventName $eventType event; ${e.message}",
        UpdatesErrorCode.JSRuntimeError
      )
    }
  }

  @Synchronized
  private fun sendQueuedEventsToEventEmitter() {
    val eventEmitter = eventEmitter
    if (eventEmitter == null) {
      logger.error("Could not emit events; no event emitter was found.", UpdatesErrorCode.JSRuntimeError)
      return
    }

    eventsToSendToJS.forEach { event ->
      val eventName = event.first
      val eventParams = event.second
      logger.info("Emitted event: name = $eventName, type = ${eventParams.getString("type")}")
      eventEmitter.emit(eventName, eventParams)
    }
    eventsToSendToJS.clear()
  }
}
