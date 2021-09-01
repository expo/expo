package expo.modules.location.exceptions

import expo.modules.core.errors.CodedException
import expo.modules.core.interfaces.CodedThrowable
import java.lang.Exception

class LocationRequestRejectedException(cause: Exception) : CodedException(
    "Location request has been rejected: " + cause.message
) {
  override fun getCode(): String {
    return "E_LOCATION_REQUEST_REJECTED"
  }
}
