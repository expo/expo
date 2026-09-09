package expo.modules.router

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RouterScrollViewDetectorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoRouterScrollViewDetector")

    View(RouterScrollViewDetectorView::class) {
      Events("onScrollViewDetected")
    }
  }
}
