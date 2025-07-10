package expo.modules.meshgradient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MeshGradientModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoMeshGradient")

    View(MeshGradientView::class)
  }
}
