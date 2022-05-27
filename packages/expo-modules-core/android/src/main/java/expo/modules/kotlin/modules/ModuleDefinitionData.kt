package expo.modules.kotlin.modules

import expo.modules.kotlin.ConcatIterator
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.functions.AsyncFunction
import expo.modules.kotlin.functions.SuspendFunctionComponentBuilder
import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.views.ViewManagerDefinition

/**
 * Intermediate data used to create a proper [ProcessedModuleDefinition].
 * It contains all, unprocessed data from [ModuleDefinitionBuilder].
 */
class ModuleDefinitionData(
  val name: String,
  val constantsProvider: () -> Map<String, Any?>,
  val syncFunctions: Map<String, SyncFunctionComponent>,
  val asyncFunctions: Map<String, AsyncFunction>,
  val suspendFunctionBuilders: List<SuspendFunctionComponentBuilder>,
  val viewManagerDefinition: ViewManagerDefinition? = null,
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
  val eventsDefinition: EventsDefinition? = null
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
  val constantsProvider = data.constantsProvider
  val syncFunctions = data.syncFunctions
  val asyncFunctions = data.asyncFunctions + data.suspendFunctionBuilders.associate { builder ->
    builder.name to builder.build((moduleHolder))
  }
  val viewManagerDefinition = data.viewManagerDefinition
  val eventListeners = data.eventListeners
  val eventsDefinition = data.eventsDefinition

  val functions
    get() = ConcatIterator(syncFunctions.values.iterator(), asyncFunctions.values.iterator())
}
