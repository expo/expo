package expo.modules.integrity

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class IntegrityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAppIntegrity")
  }
}
