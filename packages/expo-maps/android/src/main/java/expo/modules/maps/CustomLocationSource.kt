package expo.modules.maps

import android.location.Location
import com.google.android.gms.maps.LocationSource
import com.google.android.gms.maps.LocationSource.OnLocationChangedListener

class CustomLocationSource : LocationSource {
  private var listener: OnLocationChangedListener? = null

  override fun activate(listener: OnLocationChangedListener) {
    this.listener = listener
  }

  override fun deactivate() {
    listener = null
  }

  fun onLocationChanged(location: Location) {
    listener?.onLocationChanged(location)
  }
}
