package expo.modules.maps.googleMaps

import com.google.android.gms.maps.GoogleMap
import expo.modules.maps.interfaces.Gestures

class GoogleMapsGestures(private val googleMap: GoogleMap) : Gestures {

  override fun setEnabledRotateGesture(enabled: Boolean) {
    googleMap.uiSettings.isRotateGesturesEnabled = enabled
  }

  override fun setEnabledScrollGesture(enabled: Boolean) {
    googleMap.uiSettings.isScrollGesturesEnabled = enabled
  }

  override fun setEnabledTiltGesture(enabled: Boolean) {
    googleMap.uiSettings.isTiltGesturesEnabled = enabled
  }

  override fun setEnabledZoomGesture(enabled: Boolean) {
    googleMap.uiSettings.isZoomGesturesEnabled = enabled
  }
}
