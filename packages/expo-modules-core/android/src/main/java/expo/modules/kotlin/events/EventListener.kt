package expo.modules.kotlin.events

sealed class EventListener(val eventName: EventName)

/**
 * Listener for events without sender and payload.
 */
class BasicEventListener(
  eventName: EventName,
  val body: () -> Unit
) : EventListener(eventName) {
  fun call() {
    body()
  }
}

/**
 * Listener for events with payload.
 */
class EventListenerWithPayload<Payload>(
  eventName: EventName,
  val body: (Payload) -> Unit
) : EventListener(eventName) {
  fun call(sender: Payload) {
    body(sender)
  }
}

/**
 * Listener for events that specify sender and payload.
 */
class EventListenerWithSenderAndPayload<Sender, Payload>(
  eventName: EventName,
  val body: (Sender, Payload) -> Unit
) : EventListener(eventName) {
  fun call(sender: Sender, payload: Payload) {
    body(sender, payload)
  }
}
