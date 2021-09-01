package expo.modules.location.exceptions

import expo.modules.core.errors.CodedException

class LocationBackgroundUnauthorizedException : CodedException(
    "Not authorized to use background location services."
) {
  override fun getCode(): String {
    return "E_LOCATION_BACKGROUND_UNAUTHORIZED"
  }
}
