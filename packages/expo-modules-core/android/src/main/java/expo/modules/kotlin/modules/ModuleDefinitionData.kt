package expo.modules.kotlin.modules

import expo.modules.kotlin.activityresult.AppContextActivityResultCaller
import expo.modules.kotlin.classcomponent.ClassDefinitionData
import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.objects.ObjectDefinitionData
import expo.modules.kotlin.views.ViewManagerDefinition

class ModuleDefinitionData(
  val name: String,
  val objectDefinition: ObjectDefinitionData,
  val viewManagerDefinitions: Map<String, ViewManagerDefinition> = emptyMap(),
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
  val registerContracts: (suspend AppContextActivityResultCaller.() -> Unit)? = null,
  val classData: List<ClassDefinitionData> = emptyList()
) {
  val constantsProvider = objectDefinition.legacyConstantsProvider
  val syncFunctions = objectDefinition.syncFunctions
  val asyncFunctions = objectDefinition.asyncFunctions
  val eventsDefinition = objectDefinition.eventsDefinition
  val properties = objectDefinition.properties
  val constants = objectDefinition.constants
  val functions = objectDefinition.functions
}
