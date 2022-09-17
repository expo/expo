package abi46_0_0.expo.modules.kotlin.modules

import abi46_0_0.expo.modules.kotlin.ConcatIterator
import abi46_0_0.expo.modules.kotlin.ModuleHolder
import abi46_0_0.expo.modules.kotlin.events.EventListener
import abi46_0_0.expo.modules.kotlin.events.EventName
import abi46_0_0.expo.modules.kotlin.objects.ObjectDefinitionData
import abi46_0_0.expo.modules.kotlin.views.ViewManagerDefinition

/**
 * Intermediate data used to create a proper [ProcessedModuleDefinition].
 * It contains all, unprocessed data from [ModuleDefinitionBuilder].
 */
class ModuleDefinitionData(
  val name: String,
  val objectDefinition: ObjectDefinitionData,
  val viewManagerDefinition: ViewManagerDefinition? = null,
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
)

/**
 * A final version of the ModuleDefinition.
 * Most values are just copied from [ModuleDefinitionData].
 * However some fields like `asyncFunctions` need to be processed or bound with the [ModuleHolder].
 */
class ProcessedModuleDefinition(
  data: ModuleDefinitionData,
  moduleHolder: ModuleHolder
) {
  val name = data.name
  val constantsProvider = data.objectDefinition.constantsProvider
  val syncFunctions = data.objectDefinition.syncFunctions
  val asyncFunctions = data.objectDefinition.asyncFunctions + data.objectDefinition.buildSuspendFunctions(moduleHolder)
  val viewManagerDefinition = data.viewManagerDefinition
  val eventListeners = data.eventListeners
  val eventsDefinition = data.objectDefinition.eventsDefinition
  val properties = data.objectDefinition.properties

  val functions
    get() = ConcatIterator(syncFunctions.values.iterator(), asyncFunctions.values.iterator())
}
