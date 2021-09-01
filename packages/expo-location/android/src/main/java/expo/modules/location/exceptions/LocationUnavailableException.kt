package expo.modules.location.exceptions

import expo.modules.core.errors.CodedException
import expo.modules.core.interfaces.CodedThrowable

class LocationUnavailableException : CodedException(
    "Location provider is unavailable. Make sure that location services are enabled."
) {
  override fun getCode(): String {
    return "E_LOCATION_UNAVAILABLE"
  }
}
