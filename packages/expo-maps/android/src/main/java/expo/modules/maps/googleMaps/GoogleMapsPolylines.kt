package expo.modules.maps.googleMaps

import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.*
import expo.modules.maps.*
import expo.modules.maps.interfaces.Polylines

class GoogleMapsPolylines(private val map: GoogleMap) : Polylines {
  private val polylines = mutableListOf<Polyline>()

  override fun setPolylines(polylineObjects: Array<PolylineObject>) {
    detachAndDeletePolylines()
    for (polylineObject in polylineObjects) {
      val polylineOptions = PolylineOptions()
      for (point in polylineObject.points) {
        polylineOptions.add(LatLng(point.latitude, point.longitude))
      }

      polylineObject.color?.let { polylineOptions.color(colorStringToARGBInt(it)) }
      polylineObject.width?.let { polylineOptions.width(it) }
      polylineObject.pattern?.let { polylineOptions.pattern(it.map(::patternItemToNative)) }
      polylineObject.jointType?.let { polylineOptions.jointType(jointToNative(it)) }
      polylineObject.capType?.let {
        polylineOptions.startCap(capToNative(it))
        polylineOptions.endCap(capToNative(it))
      }

      val polyline = map.addPolyline(polylineOptions)
      polylines.add(polyline)
    }
  }

  override fun detachAndDeletePolylines() {
    for (polyline in polylines) {
      polyline.remove()
    }
    polylines.clear()
  }
}
