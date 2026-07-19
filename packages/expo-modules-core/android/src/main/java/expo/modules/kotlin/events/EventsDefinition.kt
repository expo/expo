package expo.modules.kotlin.events

class EventsDefinition(val names: Array<String>) {
  operator fun plus(other: EventsDefinition?): EventsDefinition {
    if (other == null) {
      return this
    }

    return EventsDefinition(names + other.names)
  }
}
