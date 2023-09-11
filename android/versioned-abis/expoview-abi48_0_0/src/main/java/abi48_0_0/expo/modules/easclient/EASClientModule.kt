package abi48_0_0.expo.modules.easclient

import abi48_0_0.expo.modules.kotlin.modules.Module
import abi48_0_0.expo.modules.kotlin.modules.ModuleDefinition

class EASClientModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext) {
      "React Application Context is null"
    }

  override fun definition() = ModuleDefinition {
    Name("EASClient")

    Constants {
      mapOf("clientID" to EASClientID(context).uuid.toString())
    }
  }
}
