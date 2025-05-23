package expo.modules.kotlin.objects

import expo.modules.kotlin.ConcatIterator
import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.functions.BaseAsyncFunctionComponent
import expo.modules.kotlin.functions.SyncFunctionComponent

class ObjectDefinitionData(
  val legacyConstantsProvider: () -> Map<String, Any?>,
  val syncFunctions: Map<String, SyncFunctionComponent>,
  val asyncFunctions: Map<String, BaseAsyncFunctionComponent>,
  val eventsDefinition: EventsDefinition?,
  val properties: Map<String, PropertyComponent>,
  val constants: Map<String, ConstantComponent>
) {
  val functions
    get() = ConcatIterator(syncFunctions.values.iterator(), asyncFunctions.values.iterator())

  operator fun plus(other: ObjectDefinitionData?): ObjectDefinitionData {
    if (other == null) {
      return this
    }

    return ObjectDefinitionData(
      legacyConstantsProvider = { legacyConstantsProvider() + other.legacyConstantsProvider() },
      syncFunctions = syncFunctions + other.syncFunctions,
      asyncFunctions = asyncFunctions + other.asyncFunctions,
      eventsDefinition = eventsDefinition?.plus(other.eventsDefinition),
      properties = properties + other.properties,
      constants = constants + other.constants
    )
  }
}
