package expo.modules.updates.events

import expo.modules.kotlin.events.EventEmitter
import expo.modules.updates.statemachine.UpdatesStateContext

enum class UpdatesJSEvent(val eventName: String) {
  StateChange("Expo.nativeUpdatesStateChangeEvent")
}

interface IUpdatesEventManager {
  var eventEmitter: EventEmitter?
  fun sendStateMachineContextEvent(context: UpdatesStateContext)
}
