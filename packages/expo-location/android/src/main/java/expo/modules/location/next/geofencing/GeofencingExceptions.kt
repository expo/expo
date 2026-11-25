package expo.modules.location.next.geofencing

import com.google.android.gms.common.api.ApiException
import com.google.android.gms.location.GeofenceStatusCodes
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

fun Exception.toGeofencingErrorMessage(): String {
  val statusCode = (this as? ApiException)?.statusCode
  return when (statusCode) {
    null ->
      "Android could not monitor the regions passed to start: ${message ?: this}"
    GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE ->
      "Android stopped monitoring the regions because geofencing is not available. Check that location " +
        "services are on and the background location permission is granted, then start the geofencing task again"
    GeofenceStatusCodes.GEOFENCE_TOO_MANY_GEOFENCES ->
      "Android monitors at most 100 regions per app, so it rejected the regions passed to start. " +
        "Reduce the number of regions passed to start, including regions monitored elsewhere in the app, " +
        "and start the geofencing task again"
    GeofenceStatusCodes.GEOFENCE_TOO_MANY_PENDING_INTENTS ->
      "Android allows at most 5 pending intents for geofencing per app, so it rejected the regions passed " +
        "to start. Remove other geofencing registrations in the app and start the geofencing task again"
    else ->
      "Android could not monitor the regions passed to start: ${GeofenceStatusCodes.getStatusCodeString(statusCode)}"
  }
}
