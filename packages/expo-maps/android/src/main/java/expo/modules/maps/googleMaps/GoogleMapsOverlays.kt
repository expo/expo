package expo.modules.maps.googleMaps

import android.net.Uri
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.GroundOverlay
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.GroundOverlayOptions
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import expo.modules.maps.OverlayObject
import expo.modules.maps.interfaces.Overlays

class GoogleMapsOverlays(private val map: GoogleMap) : Overlays {

  private val overlays = mutableListOf<GroundOverlay>()

  override fun setOverlays(overlayObjects: Array<OverlayObject>) {
    detachAndDeleteOverlays()

    overlayObjects.forEach { overlayObject ->
      val localUri = Uri.parse(overlayObject.icon).path!!
      val southWest = LatLng(overlayObject.bounds.southWest.latitude, overlayObject.bounds.southWest.longitude)
      val northEast = LatLng(overlayObject.bounds.northEast.latitude, overlayObject.bounds.northEast.longitude)
      val bounds = LatLngBounds(southWest, northEast)
      val groundOverlayOptions = GroundOverlayOptions().image(BitmapDescriptorFactory.fromPath(localUri)).positionFromBounds(bounds)
      map.addGroundOverlay(groundOverlayOptions)?.let { overlays.add(it) }
    }
  }

  override fun detachAndDeleteOverlays() {
    overlays.forEach { it.remove() }
    overlays.clear()
  }
}
