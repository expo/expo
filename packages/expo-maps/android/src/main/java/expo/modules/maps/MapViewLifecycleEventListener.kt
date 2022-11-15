package expo.modules.maps

import com.google.android.gms.maps.MapView
import expo.modules.core.interfaces.LifecycleEventListener

class MapViewLifecycleEventListener(private val mapView: MapView) : LifecycleEventListener {

  override fun onHostResume() {
    mapView.onResume()
  }

  override fun onHostPause() {
    mapView.onPause()
  }

  override fun onHostDestroy() {
    mapView.onDestroy()
  }
}
