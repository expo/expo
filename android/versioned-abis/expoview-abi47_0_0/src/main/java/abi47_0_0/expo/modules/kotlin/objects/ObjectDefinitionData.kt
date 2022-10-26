package abi47_0_0.expo.modules.kotlin.objects

import abi47_0_0.expo.modules.kotlin.events.EventsDefinition
import abi47_0_0.expo.modules.kotlin.functions.BaseAsyncFunctionComponent
import abi47_0_0.expo.modules.kotlin.functions.SyncFunctionComponent

class ObjectDefinitionData(
  val constantsProvider: () -> Map<String, Any?>,
  val syncFunctions: Map<String, SyncFunctionComponent>,
  val asyncFunctions: Map<String, BaseAsyncFunctionComponent>,
  val eventsDefinition: EventsDefinition?,
  val properties: Map<String, PropertyComponent>
)
