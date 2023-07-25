package versioned.host.exp.exponent.core.modules

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoGoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGoModules")
  }
}
