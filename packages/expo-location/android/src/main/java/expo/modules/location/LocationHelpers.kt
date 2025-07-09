package expo.modules.location

import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.os.Bundle
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.Granularity
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.Priority
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.location.records.LocationLastKnownOptions
import expo.modules.location.records.LocationOptions
import expo.modules.location.records.LocationResponse
import expo.modules.location.records.PermissionRequestResponse
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class LocationHelpers {
  companion object {
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

      return LocationRequest.Builder(locationParams.interval)
        .setMinUpdateIntervalMillis(locationParams.interval)
        .setMaxUpdateDelayMillis(locationParams.interval)
        .setMinUpdateDistanceMeters(locationParams.distance)
        .setPriority(mapAccuracyToPriority(options.accuracy))
        .build()
    }

    internal fun prepareCurrentLocationRequest(options: LocationOptions): CurrentLocationRequest {
      val locationParams = mapOptionsToLocationParams(options)

      return CurrentLocationRequest.Builder().apply {
        setGranularity(Granularity.GRANULARITY_PERMISSION_LEVEL)
        setPriority(mapAccuracyToPriority(options.accuracy))
        setMaxUpdateAgeMillis(locationParams.interval)
      }.build()
    }

    fun requestSingleLocation(locationProvider: FusedLocationProviderClient, locationRequest: CurrentLocationRequest, promise: Promise) {
      try {
        locationProvider.getCurrentLocation(locationRequest, null)
          .addOnSuccessListener { location: Location? ->
            if (location == null) {
              promise.reject(CurrentLocationIsUnavailableException())
              return@addOnSuccessListener
            }

            promise.resolve(LocationResponse(location))
          }
          .addOnFailureListener {
            promise.reject(LocationRequestRejectedException(it))
          }
          .addOnCanceledListener {
            promise.reject(LocationRequestCancelledException())
          }
      } catch (e: SecurityException) {
        promise.reject(LocationRequestRejectedException(e))
      }
    }

    fun requestContinuousUpdates(locationModule: LocationModule, locationRequest: LocationRequest, watchId: Int, promise: Promise) {
      locationModule.requestLocationUpdates(
        locationRequest,
        watchId,
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
      val locationParams = buildLocationParamsForAccuracy(accuracy)

      options.timeInterval?.let {
        locationParams.interval = it
      }
      options.distanceInterval?.let {
        locationParams.distance = it.toFloat()
      }

      return locationParams
    }

    private fun mapAccuracyToPriority(accuracy: Int): Int {
      return when (accuracy) {
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> Priority.PRIORITY_HIGH_ACCURACY
        LocationModule.ACCURACY_BALANCED, LocationModule.ACCURACY_LOW -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
        LocationModule.ACCURACY_LOWEST -> Priority.PRIORITY_LOW_POWER
        else -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
      }
    }

    private fun buildLocationParamsForAccuracy(accuracy: Int): LocationParams {
      return when (accuracy) {
        LocationModule.ACCURACY_LOWEST -> LocationParams(accuracy = LocationAccuracy.LOWEST, distance = 3000f, interval = 10000)
        LocationModule.ACCURACY_LOW -> LocationParams(accuracy = LocationAccuracy.LOW, distance = 1000f, interval = 5000)
        LocationModule.ACCURACY_BALANCED -> LocationParams(accuracy = LocationAccuracy.MEDIUM, distance = 100f, interval = 3000)
        LocationModule.ACCURACY_HIGH -> LocationParams(accuracy = LocationAccuracy.HIGH, distance = 50f, interval = 2000)
        LocationModule.ACCURACY_HIGHEST -> LocationParams(accuracy = LocationAccuracy.HIGH, distance = 25f, interval = 1000)
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION -> LocationParams(accuracy = LocationAccuracy.HIGH, distance = 0f, interval = 500)
        else -> LocationParams(accuracy = LocationAccuracy.MEDIUM, distance = 100f, interval = 3000)
      }
    }

    fun isAnyProviderAvailable(context: Context?): Boolean {
      val locationManager = context?.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        ?: return false
      return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) || locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    // Decorator for Permissions.getPermissionsWithPermissionsManager, for use in Kotlin coroutines
    internal suspend fun getPermissionsWithPermissionsManager(contextPermissions: Permissions, vararg permissionStrings: String): PermissionRequestResponse {
      return suspendCoroutine { continuation ->
        Permissions.getPermissionsWithPermissionsManager(
          contextPermissions,
          object : Promise {
            override fun resolve(value: Any?) {
              val result = value as? Bundle
                ?: throw ConversionException(Any::class.java, Bundle::class.java, "value returned by the permission promise is not a Bundle")
              continuation.resume(PermissionRequestResponse(result))
            }

            override fun reject(code: String, message: String?, cause: Throwable?) {
              continuation.resumeWithException(CodedException(code, message, cause))
            }
          },
          *permissionStrings
        )
      }
    }

    // Decorator for Permissions.getPermissionsWithPermissionsManager, for use in Kotlin coroutines
    internal suspend fun askForPermissionsWithPermissionsManager(contextPermissions: Permissions, vararg permissionStrings: String): Bundle {
      return suspendCoroutine {
        Permissions.askForPermissionsWithPermissionsManager(
          contextPermissions,
          object : Promise {
            override fun resolve(value: Any?) {
              it.resume(
                value as? Bundle
                  ?: throw ConversionException(Any::class.java, Bundle::class.java, "value returned by the permission promise is not a Bundle")
              )
            }

            override fun reject(code: String, message: String?, cause: Throwable?) {
              it.resumeWithException(CodedException(code, message, cause))
            }
          },
          *permissionStrings
        )
      }
    }
  }
}

/**
 * A singleton that keeps information about whether the app is in the foreground or not.
 * This is a simple solution for passing current foreground information from the LocationModule to LocationTaskConsumer.
 */
object AppForegroundedSingleton {
  var isForegrounded = false
}
