package abi44_0_0.expo.modules.kotlin.modules

import abi44_0_0.expo.modules.kotlin.events.EventListener
import abi44_0_0.expo.modules.kotlin.events.EventName
import abi44_0_0.expo.modules.kotlin.events.EventsDefinition
import abi44_0_0.expo.modules.kotlin.methods.AnyMethod
import abi44_0_0.expo.modules.kotlin.views.ViewManagerDefinition

class ModuleDefinitionData(
  val name: String,
  val constantsProvider: () -> Map<String, Any?>,
  val methods: Map<String, AnyMethod>,
  val viewManagerDefinition: ViewManagerDefinition? = null,
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
  val eventsDefinition: EventsDefinition? = null
)
