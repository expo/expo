package expo.modules.gl

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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
