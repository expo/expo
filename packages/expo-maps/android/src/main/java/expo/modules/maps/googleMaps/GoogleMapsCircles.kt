package expo.modules.maps.googleMaps

import android.graphics.Color
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.Circle
import com.google.android.gms.maps.model.CircleOptions
import com.google.android.gms.maps.model.LatLng
import expo.modules.maps.CircleObject
import expo.modules.maps.interfaces.Circles

class GoogleMapsCircles(map: GoogleMap) : Circles {
  private val circles = mutableListOf<Circle>()
  private var googleMap: GoogleMap = map

  override fun setCircles(circleObjects: Array<CircleObject>) {
    detachAndDeleteCircles()
    for (circleObject in circleObjects) {
      val circleOptions = CircleOptions()
      circleOptions.center(LatLng(circleObject.center.latitude, circleObject.center.longitude))
      circleOptions.radius(circleObject.radius)
      circleObject.fillColor?.let { circleOptions.fillColor(colorStringtoInt(it)) }
      circleObject.strokeColor?.let { circleOptions.strokeColor(colorStringtoInt(it)) }
      circleObject.strokeWidth?.let { circleOptions.strokeWidth(it) }
      val circle = googleMap.addCircle(circleOptions)
      circles.add(circle)
    }
  }

  override fun detachAndDeleteCircles() {
    for (circle in circles) {
      circle.remove()
    }
    circles.clear()
  }

  private fun colorStringtoInt(colorString: String): Int {
    return when (colorString.length) {
      4 -> Color.argb(
        0xFF,
        Integer.decode("0x" + colorString[1] + colorString[1]),
        Integer.decode("0x" + colorString[2] + colorString[2]),
        Integer.decode("0x" + colorString[3] + colorString[3])
      )
      5 -> Color.argb(
        Integer.decode("0x" + colorString[4] + colorString[4]),
        Integer.decode("0x" + colorString[1] + colorString[1]),
        Integer.decode("0x" + colorString[2] + colorString[2]),
        Integer.decode("0x" + colorString[3] + colorString[3])
      )
      7 -> Color.argb(
        0xFF,
        Integer.decode("0x" + colorString.substring(1..2)),
        Integer.decode("0x" + colorString.substring(3..4)),
        Integer.decode("0x" + colorString.substring(5..6))
      )
      9 -> Color.argb(
        Integer.decode("0x" + colorString.substring(7..8)),
        Integer.decode("0x" + colorString.substring(1..2)),
        Integer.decode("0x" + colorString.substring(3..4)),
        Integer.decode("0x" + colorString.substring(5..6))
      )
      else -> throw IllegalArgumentException("String $colorString is not a valid color representation")
    }
  }
}
