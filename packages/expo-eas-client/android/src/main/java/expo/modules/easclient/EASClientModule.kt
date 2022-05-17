package expo.modules.easclient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EASClientModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EASClient")

    Constants {
      mapOf("clientID" to EASClientID(context).uuid.toString())
    }
  }
}
