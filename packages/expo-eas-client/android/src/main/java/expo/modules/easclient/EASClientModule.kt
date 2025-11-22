package expo.modules.easclient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EASClientModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext) {
      "React Application Context is null"
    }

  override fun definition() = ModuleDefinition {
    Name("EASClient")

    Constant("clientID") { EASClientID(context).uuid.toString() }
  }
}
