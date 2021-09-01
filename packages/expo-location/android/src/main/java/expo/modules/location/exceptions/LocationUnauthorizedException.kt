package expo.modules.location.exceptions

import expo.modules.core.errors.CodedException
import expo.modules.core.interfaces.CodedThrowable

class LocationUnauthorizedException : CodedException("Not authorized to use location services.") {
  override fun getCode(): String {
    return "E_LOCATION_UNAUTHORIZED"
  }
}
