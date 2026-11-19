package expo.modules.location.next.geofencing

import expo.modules.kotlin.exception.CodedException

class GeofencingRegionInvalid(identifier: String) :
  CodedException(
    "The region '$identifier' cannot be monitored. Its center must be a valid coordinate, its radius " +
      "must be greater than 0 meters, and its identifier must be non-empty and unique within one call. " +
      "Fix the region and call start again"
  )

class GeofencingTaskNameInvalid(name: String) :
  CodedException(
    "The geofencing task name '$name' is not valid. The task name can contain only ASCII letters and digits"
  )

class GeofencingPreciseLocationNotGranted :
  CodedException(
    "Geofencing needs the precise location permission, but only approximate location is granted. " +
      "Call requestForegroundPermissions() and make sure the user grants precise location, then start " +
      "the geofencing task again"
  )

class GeofencingUnsupported :
  CodedException(
    "The selected location provider cannot monitor regions. On Android, geofencing needs Google Play " +
      "services, so select the Gms or the Fallback provider on a device that has them"
  )
