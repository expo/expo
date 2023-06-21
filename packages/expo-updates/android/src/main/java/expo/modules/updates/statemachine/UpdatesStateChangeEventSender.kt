package expo.modules.updates.statemachine

/**
Protocol with a method for sending state change events to JS.
In production, this is implemented by the UpdatesController singleton.
 */
interface UpdatesStateChangeEventSender {
  // Method to send events
  fun sendUpdateStateChangeEventToBridge(eventType: UpdatesStateEventType, context: UpdatesStateContext)
}
