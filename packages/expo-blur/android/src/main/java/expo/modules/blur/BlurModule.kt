package expo.modules.blur

import expo.modules.blur.enums.BlurMethod
import expo.modules.blur.enums.TintStyle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BlurModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlur")

    View(ExpoBlurView::class) {
      Name("ExpoBlurView")

      Prop("blurTargetId") { view, blurTargetId: Int? ->
        view.setBlurTargetId(blurTargetId)
      }

      Prop("intensity") { view: ExpoBlurView, intensity: Float ->
        view.setBlurRadius(intensity)
      }

      Prop("tint") { view: ExpoBlurView, tint: TintStyle ->
        view.tint = tint
      }

      Prop("blurReductionFactor") { view: ExpoBlurView, blurReductionFactor: Float ->
        view.applyBlurReduction(blurReductionFactor)
      }

      Prop("experimentalBlurMethod") { view: ExpoBlurView, experimentalBlurMethod: BlurMethod ->
        view.setBlurMethod(experimentalBlurMethod)
      }

      OnViewDidUpdateProps { view: ExpoBlurView ->
        view.applyTint()
      }
    }

    View(ExpoBlurTargetView::class) {
      Name("ExpoBlurTargetView")
    }
  }
}
