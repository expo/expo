package expo.modules.maps

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StreetViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGoogleStreetView")

    View(GoogleStreetView::class) { }
  }
}
