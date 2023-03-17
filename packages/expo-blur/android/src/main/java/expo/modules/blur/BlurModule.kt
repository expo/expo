package expo.modules.blur

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BlurModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlurView")

    View(ExpoBlurView::class) {

      // Defines a setter for the `name` prop.
      Prop("intensity") { view: ExpoBlurView, intensity: Float ->
        view.setBlurRadius(intensity)
      }

      Prop("tintColor") { view: ExpoBlurView, tintColor: Int ->
        view.setTint(tintColor)
      }

      Prop("blurReductionFactor") { view: ExpoBlurView, blurReductionFactor: Float ->
        view.applyBlurReduction(blurReductionFactor)
      }
    }
  }
}
