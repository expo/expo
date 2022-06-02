package abi45_0_0.expo.modules.kotlin.modules

import abi45_0_0.expo.modules.kotlin.events.EventListener
import abi45_0_0.expo.modules.kotlin.events.EventName
import abi45_0_0.expo.modules.kotlin.events.EventsDefinition
import abi45_0_0.expo.modules.kotlin.functions.AnyFunction
import abi45_0_0.expo.modules.kotlin.views.ViewManagerDefinition

class ModuleDefinitionData(
  val name: String,
  val constantsProvider: () -> Map<String, Any?>,
  val methods: Map<String, AnyFunction>,
  val viewManagerDefinition: ViewManagerDefinition? = null,
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
  val eventsDefinition: EventsDefinition? = null
)
