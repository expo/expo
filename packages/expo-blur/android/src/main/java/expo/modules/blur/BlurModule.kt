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

      Prop("blurMethod") { view: ExpoBlurView, blurMethod: BlurMethod ->
        view.setBlurMethod(blurMethod)
      }

      Prop("borderRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderRadius(radius)
      }

      Prop("borderTopLeftRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderTopLeftRadius(radius)
      }

      Prop("borderTopRightRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderTopRightRadius(radius)
      }

      Prop("borderBottomLeftRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderBottomLeftRadius(radius)
      }

      Prop("borderBottomRightRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderBottomRightRadius(radius)
      }

      Prop("borderTopStartRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderTopStartRadius(radius)
      }

      Prop("borderTopEndRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderTopEndRadius(radius)
      }

      Prop("borderBottomStartRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderBottomStartRadius(radius)
      }

      Prop("borderBottomEndRadius") { view: ExpoBlurView, radius: Float? ->
        view.setBorderBottomEndRadius(radius)
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
