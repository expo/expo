package expo.modules.easclientid

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EASClientIDModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext) {
      "React Application Context is null"
    }

  override fun definition() = ModuleDefinition {
    name("EASClientID")

    asyncFunction("getClientIDAsync") {
      EASClientID(context).uuid.toString()
    }
  }
}
