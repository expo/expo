package expo.modules.location

import android.content.Context
import android.location.Location
import android.location.LocationManager
import com.google.android.gms.location.LocationRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.location.records.LocationLastKnownOptions
import expo.modules.location.records.LocationOptions
import expo.modules.location.records.LocationResponse
import io.nlopez.smartlocation.location.config.LocationAccuracy
import io.nlopez.smartlocation.location.config.LocationParams

class LocationHelpers {
  companion object {
    val TAG: String = LocationHelpers::class.java.simpleName

    /**
     * Checks whether given location didn't exceed given `maxAge` and fits in the required accuracy.
     */
    internal fun isLocationValid(location: Location?, options: LocationLastKnownOptions): Boolean {
      if (location == null) {
        return false
      }
      val maxAge = options.maxAge ?: Double.MAX_VALUE
      val requiredAccuracy = options.requiredAccuracy ?: Double.MAX_VALUE
      val timeDiff = (System.currentTimeMillis() - location.time).toDouble()
      return timeDiff <= maxAge && location.accuracy <= requiredAccuracy
    }

    fun hasNetworkProviderEnabled(context: Context?): Boolean {
      if (context == null) {
        return false
      }
      val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
      return locationManager != null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    internal fun prepareLocationRequest(options: LocationOptions): LocationRequest {
      val locationParams = mapOptionsToLocationParams(options)
      val accuracy = options.accuracy

      return LocationRequest.create().apply {
        fastestInterval = locationParams.interval
        interval = locationParams.interval
        maxWaitTime = locationParams.interval
        smallestDisplacement = locationParams.distance
        priority = mapAccuracyToPriority(accuracy)
      }
    }

    fun requestSingleLocation(locationModule: LocationModule, locationRequest: LocationRequest, promise: Promise) {
      // we want just one update
      locationRequest.numUpdates = 1
      locationModule.requestLocationUpdates(
        locationRequest, null,
        object : LocationRequestCallbacks {
          override fun onLocationChanged(location: Location) {
            promise.resolve(LocationResponse(location))
          }

          override fun onLocationError(cause: CodedException) {
            promise.reject(cause)
          }

          override fun onRequestFailed(cause: CodedException) {
            promise.reject(cause)
          }
        }
      )
    }

    fun requestContinuousUpdates(locationModule: LocationModule, locationRequest: LocationRequest, watchId: Int, promise: Promise) {
      locationModule.requestLocationUpdates(
        locationRequest, watchId,
        object : LocationRequestCallbacks {
          override fun onLocationChanged(location: Location) {
            locationModule.sendLocationResponse(watchId, LocationResponse(location))
          }

          override fun onRequestSuccess() {
            promise.resolve(null)
          }

          override fun onRequestFailed(cause: CodedException) {
            promise.reject(cause)
          }
        }
      )
    }

    private fun mapOptionsToLocationParams(options: LocationOptions): LocationParams {
      val accuracy = options.accuracy
      val locationParamsBuilder = buildLocationParamsForAccuracy(accuracy)

      options.timeInterval?.let {
        locationParamsBuilder.setInterval(it)
      }
      options.distanceInterval?.let {
        locationParamsBuilder.setDistance(it.toFloat())
      }

      return locationParamsBuilder.build()
    }

    private fun mapAccuracyToPriority(accuracy: Int): Int {
      return when (accuracy) {
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> LocationRequest.PRIORITY_HIGH_ACCURACY
        LocationModule.ACCURACY_BALANCED, LocationModule.ACCURACY_LOW -> LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
        LocationModule.ACCURACY_LOWEST -> LocationRequest.PRIORITY_LOW_POWER
        else -> LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
      }
    }

    private fun buildLocationParamsForAccuracy(accuracy: Int): LocationParams.Builder {
      return when (accuracy) {
        LocationModule.ACCURACY_LOWEST -> LocationParams.Builder()
          .setAccuracy(LocationAccuracy.LOWEST)
          .setDistance(3000f)
          .setInterval(10000)

        LocationModule.ACCURACY_LOW -> LocationParams.Builder()
          .setAccuracy(LocationAccuracy.LOW)
          .setDistance(1000f)
          .setInterval(5000)

        LocationModule.ACCURACY_BALANCED -> LocationParams.Builder()
          .setAccuracy(LocationAccuracy.MEDIUM)
          .setDistance(100f)
          .setInterval(3000)

        LocationModule.ACCURACY_HIGH -> LocationParams.Builder()
          .setAccuracy(LocationAccuracy.HIGH)
          .setDistance(50f)
          .setInterval(2000)

        LocationModule.ACCURACY_HIGHEST -> LocationParams.Builder()
          .setAccuracy(LocationAccuracy.HIGH)
          .setDistance(25f)
          .setInterval(1000)

        LocationModule.ACCURACY_BEST_FOR_NAVIGATION -> LocationParams.Builder()
          .setAccuracy(LocationAccuracy.HIGH)
          .setDistance(0f)
          .setInterval(500)

        else -> LocationParams.Builder()
          .setAccuracy(LocationAccuracy.MEDIUM)
          .setDistance(100f)
          .setInterval(3000)
      }
    }

    fun isAnyProviderAvailable(context: Context?): Boolean {
      context ?: return false
      val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return false
      return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) || locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
  }
}
