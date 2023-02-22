package abi48_0_0.expo.modules.kotlin.modules

import abi48_0_0.expo.modules.kotlin.activityresult.AppContextActivityResultCaller
import abi48_0_0.expo.modules.kotlin.events.EventListener
import abi48_0_0.expo.modules.kotlin.events.EventName
import abi48_0_0.expo.modules.kotlin.objects.ObjectDefinitionData
import abi48_0_0.expo.modules.kotlin.views.ViewManagerDefinition

class ModuleDefinitionData(
  val name: String,
  val objectDefinition: ObjectDefinitionData,
  val viewManagerDefinition: ViewManagerDefinition? = null,
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
  val registerContracts: (suspend AppContextActivityResultCaller.() -> Unit)? = null
) {

  val constantsProvider = objectDefinition.constantsProvider
  val syncFunctions = objectDefinition.syncFunctions
  val asyncFunctions = objectDefinition.asyncFunctions
  val eventsDefinition = objectDefinition.eventsDefinition
  val properties = objectDefinition.properties
  val functions = objectDefinition.functions
}
