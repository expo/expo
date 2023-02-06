package abi48_0_0.expo.modules.kotlin.objects

import abi48_0_0.expo.modules.kotlin.ConcatIterator
import abi48_0_0.expo.modules.kotlin.events.EventsDefinition
import abi48_0_0.expo.modules.kotlin.functions.BaseAsyncFunctionComponent
import abi48_0_0.expo.modules.kotlin.functions.SyncFunctionComponent

class ObjectDefinitionData(
  val constantsProvider: () -> Map<String, Any?>,
  val syncFunctions: Map<String, SyncFunctionComponent>,
  val asyncFunctions: Map<String, BaseAsyncFunctionComponent>,
  val eventsDefinition: EventsDefinition?,
  val properties: Map<String, PropertyComponent>
) {
  val functions
    get() = ConcatIterator(syncFunctions.values.iterator(), asyncFunctions.values.iterator())
}
