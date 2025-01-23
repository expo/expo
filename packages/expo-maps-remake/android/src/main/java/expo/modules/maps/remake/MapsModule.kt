package expo.modules.maps.remake

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MapsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoMapsRemake")

    View(GoogleMapsView::class) {
      Events("onMapClick", "onPOIClick", "onMarkerClick", "onCameraMove")
    }
  }
}
