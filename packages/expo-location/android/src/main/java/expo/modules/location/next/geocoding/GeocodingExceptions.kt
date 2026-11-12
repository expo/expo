package expo.modules.location.next.geocoding

import expo.modules.kotlin.exception.CodedException

class NoGeocodingBackendException :
  CodedException(
    "This device has no geocoding backend. `android.location.Geocoder` is served by a backend " +
      "that is not part of the core Android framework, and devices without it - including many " +
      "without Google Play services - cannot geocode at all. Reconnecting to the network does " +
      "not help."
  )

class InvalidCoordinatesException :
  CodedException(
    "The coordinates are outside the valid range. Latitude must be between -90 and 90, " +
      "longitude between -180 and 180."
  )

class GeocodingUnavailableException(cause: Throwable? = null) :
  CodedException(
    "The geocoding service could not be reached. This is usually a network failure or a timeout, " +
      "and retrying later may succeed.",
    cause
  )

class GeocodingFailedException(cause: Throwable) :
  CodedException("Geocoding failed.", cause)
