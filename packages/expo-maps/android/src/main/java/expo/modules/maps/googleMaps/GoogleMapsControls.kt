package expo.modules.maps.googleMaps

import com.google.android.gms.maps.GoogleMap
import expo.modules.maps.interfaces.Controls

class GoogleMapsControls(private val map: GoogleMap) : Controls {

  override fun setShowZoomControl(enable: Boolean) {
    map.uiSettings.isZoomControlsEnabled = enable
  }

  override fun setShowCompass(enable: Boolean) {
    // the compass will only ever appear when the camera is oriented such that
    // it has a non-zero bearing or non-zero tilt. When the user clicks on the compass,
    // the camera animates back to the default orientation and the compass fades away shortly afterwards
    map.uiSettings.isCompassEnabled = enable
  }

  override fun setShowMapToolbar(enable: Boolean) {
    // the toolbar slides in when the user taps a marker
    // and slides out again when the marker is no longer in focus
    map.uiSettings.isMapToolbarEnabled = enable
  }

  override fun setShowMyLocationButton(enable: Boolean) {
    // the My Location button appears in the top right corner of
    // the screen only when the My Location layer is enabled
    @SuppressWarnings("MissingPermission")
    map.isMyLocationEnabled = true
    map.uiSettings.isMyLocationButtonEnabled = enable
  }

  override fun setShowLevelPicker(enable: Boolean) {
    // appears only when the user is viewing an indoor map
    map.uiSettings.isIndoorLevelPickerEnabled = enable
  }
}
