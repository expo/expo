package expo.modules.kotlin.traits

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.objects.ObjectDefinitionData

interface Trait<InputType> {
  fun export(appContext: AppContext): ObjectDefinitionData
}
