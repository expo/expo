package expo.modules.blur

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BlurModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlurView")

    View(ExpoBlurView::class) {
      Prop("intensity") { view: ExpoBlurView, intensity: Float ->
        view.setBlurRadius(intensity)
      }

      Prop("tint") { view: ExpoBlurView, tint: Int ->
        view.setTint(tint)
      }

      Prop("blurReductionFactor") { view: ExpoBlurView, blurReductionFactor: Float ->
        view.applyBlurReduction(blurReductionFactor)
      }
    }

    AsyncFunction("setNativeProps") { props: BlurModuleOptions, viewTag: Int ->
      val view = appContext.findView<ExpoBlurView>(viewTag)
        ?: throw Exceptions.ViewNotFound(ExpoBlurView::class, viewTag)

      props.blurReductionFactor?.let {
        view.applyBlurReduction(it)
      }
      props.intensity?.let {
        view.setBlurRadius(it)
      }
      props.tint?.let {
        view.setTint(it)
      }
    }.runOnQueue(Queues.MAIN)
  }
}
