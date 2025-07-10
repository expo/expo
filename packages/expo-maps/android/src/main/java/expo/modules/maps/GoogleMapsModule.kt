package expo.modules.maps

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GoogleMapsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGoogleMaps")

    View(GoogleMapsView::class) {
      Events("onMapLoaded", "onMapClick", "onMapLongClick", "onPOIClick", "onMarkerClick", "onCameraMove", "onPolylineClick", "onCircleClick", "onPolygonClick")

      AsyncFunction("setCameraPosition") Coroutine { view: GoogleMapsView, config: SetCameraPositionConfig? ->
        view.setCameraPosition(config)
      }
    }
  }
}
