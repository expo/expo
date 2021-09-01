package expo.modules.location

import android.location.Location
import expo.modules.core.errors.CodedException

abstract class LocationRequestCallbacks {
  open fun onLocationChanged(location: Location?) {}
  open fun onLocationError(throwable: CodedException?) {}
  open fun onRequestSuccess() {}
  open fun onRequestFailed(throwable: CodedException?) {}
}
