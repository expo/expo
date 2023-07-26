package expo.modules.kotlin.defaultmodules

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CoreModule : Module() {
  override fun definition() = ModuleDefinition {
    // Nothing so far, but eventually we will expose some common classes
    // and maybe even the `modules` host object.
  }
}
