package expo.modules.updates.events

import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.events.EventEmitter
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEventType

enum class UpdatesJSEvent(val eventName: String) {
  StateChange("Expo.nativeUpdatesStateChangeEvent")
}

interface IUpdatesEventManager {
  var eventEmitter: EventEmitter?
  var shouldEmitJsEvents: Boolean

  fun sendStateChangeEvent(
    eventType: UpdatesStateEventType,
    context: UpdatesStateContext,
  )
}
