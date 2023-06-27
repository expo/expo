package abi49_0_0.expo.modules.gl

import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition

class GLViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExponentGLView")

    View(GLView::class) {
      Events("onSurfaceCreate")
      Prop("enableExperimentalWorkletSupport") { view: GLView, enableExperimentalWorkletSupport: Boolean? ->
        view.enableExperimentalWorkletSupport = enableExperimentalWorkletSupport ?: false
      }
    }
  }
}
