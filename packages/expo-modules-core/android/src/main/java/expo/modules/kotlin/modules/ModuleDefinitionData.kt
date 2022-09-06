package expo.modules.kotlin.modules

import expo.modules.kotlin.ConcatIterator
import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.objects.ObjectDefinitionData
import expo.modules.kotlin.views.ViewManagerDefinition

class ModuleDefinitionData(
  val name: String,
  val objectDefinition: ObjectDefinitionData,
  val viewManagerDefinition: ViewManagerDefinition? = null,
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
) {

  val constantsProvider = objectDefinition.constantsProvider
  val syncFunctions = objectDefinition.syncFunctions
  val asyncFunctions = objectDefinition.asyncFunctions
  val eventsDefinition = objectDefinition.eventsDefinition
  val properties = objectDefinition.properties

  val functions
    get() = ConcatIterator(syncFunctions.values.iterator(), asyncFunctions.values.iterator())
}
