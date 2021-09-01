package expo.modules.location.exceptions

import expo.modules.core.errors.CodedException
import expo.modules.core.interfaces.CodedThrowable

class LocationSettingsUnsatisfiedException : CodedException(
    "Location request failed due to unsatisfied device settings."
) {
  override fun getCode(): String {
    return "E_LOCATION_SETTINGS_UNSATISFIED"
  }
}
