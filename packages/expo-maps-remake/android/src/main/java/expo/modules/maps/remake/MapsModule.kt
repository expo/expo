package expo.modules.maps.remake

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MapsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGoogleMapsRemake")

    View(GoogleMapsView::class) {
      Events("onMapLoaded", "onMapClick", "onMapLongClick", "onPOIClick", "onMarkerClick", "onCameraMove")
    }
  }
}
