package versioned.host.exp.exponent.core.modules

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.ExpoViewKernel

class ExpoGoModule(private val manifest: Manifest) : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGo")

    Constants {
      mapOf(
        "expoVersion" to ExpoViewKernel.instance.versionName,
        "manifest" to manifest.toString()
      )
    }
  }
}
