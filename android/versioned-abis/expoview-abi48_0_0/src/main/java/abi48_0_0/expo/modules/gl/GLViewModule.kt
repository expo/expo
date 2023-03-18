package abi48_0_0.expo.modules.gl

import abi48_0_0.expo.modules.kotlin.modules.Module
import abi48_0_0.expo.modules.kotlin.modules.ModuleDefinition

class GLViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExponentGLView")

    View(GLView::class) {
      Events("onSurfaceCreate")
    }
  }
}
