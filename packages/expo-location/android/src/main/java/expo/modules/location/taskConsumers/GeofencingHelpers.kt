package expo.modules.location.taskConsumers

import android.os.PersistableBundle
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofenceStatusCodes
import expo.modules.location.LocationModule
import java.util.*

object GeofencingHelpers {
  fun bundleFromRegion(identifier: String, region: Map<String, Any>) =
    PersistableBundle().apply {
      putString("identifier", identifier)
      if (region.containsKey("radius")) {
        region["radius"]?.let { putDouble("radius", doubleFromObject(it)) }
      }
      if (region.containsKey("latitude")) {
        region["latitude"]?.let { putDouble("latitude", doubleFromObject(it)) }
      }
      if (region.containsKey("longitude")) {
        region["longitude"]?.let { putDouble("longitude", doubleFromObject(it)) }
      }
      putInt("state", LocationModule.GEOFENCING_REGION_STATE_UNKNOWN)
    }

  fun regionStateForTransitionType(transitionType: Int): Int {
    return when (transitionType) {
      Geofence.GEOFENCE_TRANSITION_ENTER,
      Geofence.GEOFENCE_TRANSITION_DWELL ->
        LocationModule.GEOFENCING_REGION_STATE_INSIDE
      Geofence.GEOFENCE_TRANSITION_EXIT ->
        LocationModule.GEOFENCING_REGION_STATE_OUTSIDE
      else ->
        LocationModule.GEOFENCING_REGION_STATE_UNKNOWN
    }
  }

  fun eventTypeFromTransitionType(transitionType: Int): Int {
    return when (transitionType) {
      Geofence.GEOFENCE_TRANSITION_ENTER ->
        LocationModule.GEOFENCING_EVENT_ENTER
      Geofence.GEOFENCE_TRANSITION_EXIT ->
        LocationModule.GEOFENCING_EVENT_EXIT
      else ->
        0
    }
  }

  fun getErrorString(errorCode: Int): String {
    return when (errorCode) {
      GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE ->
        "Geofencing not available."
      GeofenceStatusCodes.GEOFENCE_TOO_MANY_GEOFENCES ->
        "Too many geofences."
      GeofenceStatusCodes.GEOFENCE_TOO_MANY_PENDING_INTENTS ->
        "Too many pending intents."
      else ->
        "Unknown geofencing error."
    }
  }

  private fun doubleFromObject(it: Any): Double {
    return if (it is Int) {
      it.toDouble()
    } else {
      it as Double
    }
  }

  fun geofenceFromRegion(region: Map<String, Any>): Geofence {
    val identifier = if (region.containsKey("identifier")) {
      region["identifier"] as String
    } else {
      UUID.randomUUID().toString()
    }
    val latitude = doubleFromObject(region["latitude"]!!)
    val longitude = doubleFromObject(region["longitude"]!!)
    val radius = doubleFromObject(region["radius"]!!)
    val notifyOnEnter =
      if (!region.containsKey("notifyOnEnter") || region["notifyOnEnter"] as Boolean) {
        Geofence.GEOFENCE_TRANSITION_ENTER
      } else {
        0
      }
    val notifyOnExit =
      if (!region.containsKey("notifyOnExit") || region["notifyOnExit"] as Boolean) {
        Geofence.GEOFENCE_TRANSITION_EXIT
      } else {
        0
      }
    val transitionTypes = notifyOnEnter or notifyOnExit
    return Geofence.Builder()
      .setRequestId(identifier)
      .setCircularRegion(latitude, longitude, radius.toFloat())
      .setExpirationDuration(Geofence.NEVER_EXPIRE)
      .setTransitionTypes(transitionTypes)
      .build()
  }
}
