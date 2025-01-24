package expo.modules.maps

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MapsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGoogleMaps")

    View(GoogleMapsView::class) {
      Events("onMapLoaded", "onMapClick", "onMapLongClick", "onPOIClick", "onMarkerClick", "onCameraMove")
    }
  }
}
