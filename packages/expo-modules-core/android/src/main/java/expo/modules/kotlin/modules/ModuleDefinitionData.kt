package expo.modules.kotlin.modules

import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.functions.AnyFunction
import expo.modules.kotlin.views.ViewManagerDefinition

class ModuleDefinitionData(
  val name: String,
  val constantsProvider: () -> Map<String, Any?>,
  val methods: Map<String, AnyFunction>,
  val viewManagerDefinition: ViewManagerDefinition? = null,
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
  val eventsDefinition: EventsDefinition? = null
)
