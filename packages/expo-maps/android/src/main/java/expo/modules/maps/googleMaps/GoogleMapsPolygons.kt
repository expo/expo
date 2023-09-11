package expo.modules.maps.googleMaps

import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.*
import expo.modules.maps.*
import expo.modules.maps.interfaces.Polygons

class GoogleMapsPolygons(private val map: GoogleMap) : Polygons {
  private val polygons = mutableListOf<Polygon>()

  override fun setPolygons(polygonObjects: Array<PolygonObject>) {
    detachAndDeletePolygons()
    for (polygonObject in polygonObjects) {
      val polygonOptions = PolygonOptions()
      for (point in polygonObject.points) {
        polygonOptions.add(LatLng(point.latitude, point.longitude))
      }

      polygonObject.fillColor?.let { polygonOptions.fillColor(colorStringToARGBInt(it)) }
      polygonObject.strokeColor?.let { polygonOptions.strokeColor(colorStringToARGBInt(it)) }
      polygonObject.strokeWidth?.let { polygonOptions.strokeWidth(it) }
      polygonObject.strokePattern?.let {
        polygonOptions.strokePattern(it.map(::patternItemToNative))
      }
      polygonObject.jointType?.let { polygonOptions.strokeJointType(it) }

      val polygon = map.addPolygon(polygonOptions)
      polygons.add(polygon)
    }
  }

  override fun detachAndDeletePolygons() {
    for (polygon in polygons) {
      polygon.remove()
    }
    polygons.clear()
  }
}
