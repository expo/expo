package abi46_0_0.expo.modules.kotlin.objects

import abi46_0_0.expo.modules.kotlin.ModuleHolder
import abi46_0_0.expo.modules.kotlin.events.EventsDefinition
import abi46_0_0.expo.modules.kotlin.functions.AsyncFunction
import abi46_0_0.expo.modules.kotlin.functions.SuspendFunctionComponent
import abi46_0_0.expo.modules.kotlin.functions.SuspendFunctionComponentBuilder
import abi46_0_0.expo.modules.kotlin.functions.SyncFunctionComponent

class ObjectDefinitionData(
  val constantsProvider: () -> Map<String, Any?>,
  val syncFunctions: Map<String, SyncFunctionComponent>,
  val asyncFunctions: Map<String, AsyncFunction>,
  val suspendFunctionBuilders: Map<String, SuspendFunctionComponentBuilder>,
  val eventsDefinition: EventsDefinition?,
  val properties: Map<String, PropertyComponent>
) {
  fun buildSuspendFunctions(moduleHolder: ModuleHolder): Map<String, SuspendFunctionComponent> {
    return suspendFunctionBuilders.mapValues { (_, value) -> value.build(moduleHolder) }
  }
}
