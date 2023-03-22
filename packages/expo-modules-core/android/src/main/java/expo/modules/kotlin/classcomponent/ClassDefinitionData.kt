package expo.modules.kotlin.classcomponent

import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.objects.ObjectDefinitionData

class ClassDefinitionData(
  val name: String,
  val constructor: SyncFunctionComponent,
  val objectDefinition: ObjectDefinitionData
)
