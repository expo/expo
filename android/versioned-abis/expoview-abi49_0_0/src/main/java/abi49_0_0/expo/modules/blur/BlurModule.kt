package abi49_0_0.expo.modules.blur

import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition

class BlurModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlurView")

    View(ExpoBlurView::class) {
      Prop("intensity") { view: ExpoBlurView, intensity: Float ->
        view.setBlurRadius(intensity)
      }

      Prop("tint") { view: ExpoBlurView, tint: String ->
        view.tint = tint
      }

      Prop("blurReductionFactor") { view: ExpoBlurView, blurReductionFactor: Float ->
        view.applyBlurReduction(blurReductionFactor)
      }

      OnViewDidUpdateProps { view: ExpoBlurView ->
        view.applyTint()
      }
    }
  }
}
