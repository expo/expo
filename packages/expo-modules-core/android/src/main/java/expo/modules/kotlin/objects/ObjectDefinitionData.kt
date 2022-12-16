package expo.modules.kotlin.objects

import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.functions.BaseAsyncFunctionComponent
import expo.modules.kotlin.functions.SyncFunctionComponent

class ObjectDefinitionData(
  val constantsProvider: () -> Map<String, Any?>,
  val syncFunctions: Map<String, SyncFunctionComponent>,
  val asyncFunctions: Map<String, BaseAsyncFunctionComponent>,
  val eventsDefinition: EventsDefinition?,
  val properties: Map<String, PropertyComponent>
)
