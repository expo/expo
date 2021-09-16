package expo.modules.location

import android.location.Location
import expo.modules.core.errors.CodedException

interface LocationRequestCallbacks {
  fun onLocationChanged(location: Location?)
  fun onLocationError(throwable: CodedException?)
  fun onRequestSuccess()
  fun onRequestFailed(throwable: CodedException?)
}
