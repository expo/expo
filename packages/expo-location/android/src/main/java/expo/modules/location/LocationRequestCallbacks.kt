package expo.modules.location

import android.location.Location
import expo.modules.core.errors.CodedException

abstract class LocationRequestCallbacks {
  open fun onLocationChanged(location: Location?) = Unit
  open fun onLocationError(throwable: CodedException?) = Unit
  open fun onRequestSuccess() = Unit
  open fun onRequestFailed(throwable: CodedException?) = Unit
}
