package expo.modules.kotlin.classcomponent

import expo.modules.kotlin.ConcatIterator
import expo.modules.kotlin.functions.BaseAsyncFunctionComponent
import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.objects.ObjectDefinitionData

class ClassDefinitionData(
  val name: String,
  val constructor: SyncFunctionComponent,
  val staticSyncFunctions: Map<String, SyncFunctionComponent>,
  val staticAsyncFunctions: Map<String, BaseAsyncFunctionComponent>,
  val objectDefinition: ObjectDefinitionData,
  val isSharedRef: Boolean
) {
  val staticFunctions
    get() = ConcatIterator(staticSyncFunctions.values.iterator(), staticAsyncFunctions.values.iterator())
}
