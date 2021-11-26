package expo.modules.lineargradient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

typealias ViewType = LinearGradientView

class LinearGradientModule : Module() {
  override fun definition() = ModuleDefinition {
    name("ExpoLinearGradient")
    viewManager {
      view { context ->
        LinearGradientView(context)
      }

      prop("colors") { view: ViewType, colors: IntArray ->
        view.setColors(colors)
      }

      prop("locations") { view: ViewType, locations: FloatArray? ->
        locations?.let {
          view.setLocations(it)
        }
      }

      prop("startPoint") { view: ViewType, startPoint: Pair<Float, Float>? ->
        view.setStartPosition(startPoint?.first ?: 0.5f, startPoint?.second ?: 0f)
      }

      prop("endPoint") { view: ViewType, endPoint: Pair<Float, Float>? ->
        view.setEndPosition(endPoint?.first ?: 0.5f, endPoint?.second ?: 1f)
      }

      prop("borderRadii") { view: ViewType, borderRadii: FloatArray? ->
        view.setBorderRadii(borderRadii ?: FloatArray(8) { 0f })
      }
    }
  }
}
