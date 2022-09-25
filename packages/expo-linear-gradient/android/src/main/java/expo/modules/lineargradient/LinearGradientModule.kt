package expo.modules.lineargradient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

typealias ViewType = LinearGradientView

class LinearGradientModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoLinearGradient")
    ViewManager {
      View { context ->
        LinearGradientView(context)
      }

      Prop("colors") { view: ViewType, colors: IntArray ->
        view.setColors(colors)
      }

      Prop("locations") { view: ViewType, locations: FloatArray? ->
        locations?.let {
          view.setLocations(it)
        }
      }

      Prop("startPoint") { view: ViewType, startPoint: Pair<Float, Float>? ->
        view.setStartPosition(startPoint?.first ?: 0.5f, startPoint?.second ?: 0f)
      }

      Prop("endPoint") { view: ViewType, endPoint: Pair<Float, Float>? ->
        view.setEndPosition(endPoint?.first ?: 0.5f, endPoint?.second ?: 1f)
      }

      Prop("borderRadii") { view: ViewType, borderRadii: FloatArray? ->
        view.setBorderRadii(borderRadii ?: FloatArray(8) { 0f })
      }
    }
  }
}
