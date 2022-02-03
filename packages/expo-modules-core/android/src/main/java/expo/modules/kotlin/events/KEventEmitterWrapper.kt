package expo.modules.kotlin.events

import android.os.Bundle
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.ModuleHolder

/**
 * In Swift, we check if the event is supported. Otherwise, we can't send such event through the bridge.
 * However, in Kotlin this is unnecessary, but to make our API consistent, we added similar check.
 * But because of that, we had to create a wrapper for EventEmitter.
 */
class KEventEmitterWrapper(
  private val moduleHolder: ModuleHolder,
  private val legacyEventEmitter: EventEmitter
) : EventEmitter by legacyEventEmitter {
  override fun emit(eventName: String, eventBody: Bundle?) {
    require(
      moduleHolder
        .definition
        .eventsDefinition
        ?.names
        ?.contains(eventName) == true
    ) { "Unsupported event: $eventName." }
    legacyEventEmitter.emit(eventName, eventBody)
  }
}
