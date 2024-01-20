package expo.modules.lineargradient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LinearGradientModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoLinearGradient")

    View(LinearGradientView::class) {
      Prop("colors") { view, colors: IntArray ->
        view.setColors(colors)
      }

      Prop("locations") { view, locations: FloatArray? ->
        locations?.let {
          view.setLocations(it)
        }
      }

      Prop("startPoint") { view, startPoint: Pair<Float, Float>? ->
        view.setStartPosition(startPoint?.first ?: 0.5f, startPoint?.second ?: 0f)
      }

      Prop("endPoint") { view, endPoint: Pair<Float, Float>? ->
        view.setEndPosition(endPoint?.first ?: 0.5f, endPoint?.second ?: 1f)
      }

      Prop("borderRadii") { view, borderRadii: FloatArray? ->
        view.setBorderRadii(borderRadii ?: FloatArray(8) { 0f })
      }
    }
  }
}
