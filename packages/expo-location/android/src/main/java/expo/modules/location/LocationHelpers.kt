package expo.modules.location

import android.content.Context
import android.location.Address
import android.location.Location
import android.location.LocationManager
import android.os.BaseBundle
import android.os.Build
import android.os.Bundle
import android.os.PersistableBundle
import android.util.Log
import com.google.android.gms.location.LocationRequest
import expo.modules.core.Promise
import expo.modules.core.errors.CodedException
import io.nlopez.smartlocation.location.config.LocationAccuracy
import io.nlopez.smartlocation.location.config.LocationParams

object LocationHelpers {
  private val TAG = LocationHelpers::class.java.simpleName

  //region public methods
  fun isAnyProviderAvailable(context: Context?): Boolean {
    if (context == null) {
      return false
    }
    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager?
    return locationManager != null
        && (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        || locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER))
  }

  fun hasNetworkProviderEnabled(context: Context?): Boolean {
    if (context == null) {
      return false
    }
    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager?
    return locationManager != null
        && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
  }

  fun <BundleType : BaseBundle> locationToBundle(
      location: Location?,
      bundleTypeClass: Class<BundleType>
  ): BundleType? {
    return if (location == null) {
      null
    } else try {
      val map = bundleTypeClass.newInstance()
      val coords = locationToCoordsBundle(location, bundleTypeClass) ?: return null
      if (map is PersistableBundle) {
        (map as PersistableBundle).putPersistableBundle("coords", coords as PersistableBundle)
      } else if (map is Bundle) {
        (map as Bundle).putBundle("coords", coords as Bundle)
        (map as Bundle).putBoolean("mocked", location.isFromMockProvider)
      }
      map.putDouble("timestamp", location.time.toDouble())
      map
    } catch (e: IllegalAccessException) {
      Log.e(TAG, "Unexpected exception was thrown when converting location to the bundle: $e")
      null
    } catch (e: InstantiationException) {
      Log.e(TAG, "Unexpected exception was thrown when converting location to the bundle: $e")
      null
    }
  }

  fun <BundleType : BaseBundle> locationToCoordsBundle(
      location: Location,
      bundleTypeClass: Class<BundleType>
  ): BundleType? {
    return try {
      val coords = bundleTypeClass.newInstance().apply {
        putDouble("latitude", location.latitude)
        putDouble("longitude", location.longitude)
        putDouble("altitude", location.altitude)
        putDouble("accuracy", location.accuracy.toDouble())
        putDouble("heading", location.bearing.toDouble())
        putDouble("speed", location.speed.toDouble())
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          putDouble("altitudeAccuracy", location.verticalAccuracyMeters.toDouble())
        } else {
          putString("altitudeAccuracy", null)
        }
      }
      coords
    } catch (e: IllegalAccessException) {
      Log.e(
          TAG,
          "Unexpected exception was thrown when converting location to coords bundle: $e"
      )
      null
    } catch (e: InstantiationException) {
      Log.e(
          TAG,
          "Unexpected exception was thrown when converting location to coords bundle: $e"
      )
      null
    }
  }

  fun addressToBundle(address: Address) = Bundle().apply {
    putString("city", address.locality)
    putString("district", address.subLocality)
    putString("street", address.thoroughfare)
    putString("region", address.adminArea)
    putString("subregion", address.subAdminArea)
    putString("country", address.countryName)
    putString("postalCode", address.postalCode)
    putString("name", address.featureName)
    putString("isoCountryCode", address.countryCode)
    putString("timezone", null)
  }

  fun headingToBundle(trueNorth: Double, magneticNorth: Double, accuracy: Int) = Bundle().apply {
    putDouble("trueHeading", trueNorth)
    putDouble("magHeading", magneticNorth)
    putInt("accuracy", accuracy)
  }

  fun prepareLocationRequest(options: Map<String?, Any?>): LocationRequest {
    val locationParams = mapOptionsToLocationParams(options)
    val accuracy = getAccuracyFromOptions(options)
    return LocationRequest()
        .setFastestInterval(locationParams.interval)
        .setInterval(locationParams.interval)
        .setMaxWaitTime(locationParams.interval)
        .setSmallestDisplacement(locationParams.distance)
        .setPriority(mapAccuracyToPriority(accuracy))
  }

  private fun mapOptionsToLocationParams(options: Map<String?, Any?>): LocationParams {
    val accuracy = getAccuracyFromOptions(options)
    val locationParamsBuilder = buildLocationParamsForAccuracy(accuracy)
    if (options.containsKey("timeInterval")) {
      val timeInterval = options["timeInterval"] as Number
      locationParamsBuilder.setInterval(timeInterval.toLong())
    }
    if (options.containsKey("distanceInterval")) {
      val distanceInterval = options["distanceInterval"] as Number
      locationParamsBuilder.setDistance(distanceInterval.toFloat())
    }
    return locationParamsBuilder.build()
  }

  fun requestSingleLocation(
      locationModule: LocationModule,
      locationRequest: LocationRequest,
      promise: Promise
  ) {
    // we want just one update
    locationRequest.numUpdates = 1
    locationModule.requestLocationUpdates(
        locationRequest,
        null,
        object : LocationRequestCallbacks() {
          override fun onLocationChanged(location: Location?) {
            promise.resolve(locationToBundle(location, Bundle::class.java))
          }

          override fun onLocationError(throwable: CodedException?) {
            promise.reject(throwable)
          }

          override fun onRequestFailed(throwable: CodedException?) {
            promise.reject(throwable)
          }
        })
  }

  fun requestContinuousUpdates(
      locationModule: LocationModule,
      locationRequest: LocationRequest,
      watchId: Int,
      promise: Promise
  ) {
    locationModule.requestLocationUpdates(
        locationRequest,
        watchId,
        object : LocationRequestCallbacks() {
          override fun onLocationChanged(location: Location?) {
            val response = Bundle()
            response.putBundle("location", locationToBundle(location, Bundle::class.java))
            locationModule.sendLocationResponse(watchId, response)
          }

          override fun onRequestSuccess() {
            promise.resolve(null)
          }

          override fun onRequestFailed(throwable: CodedException?) {
            promise.reject(throwable)
          }
        })
  }

  /**
   * Checks whether given location didn't exceed given `maxAge` and fits in the required accuracy.
   */
  fun isLocationValid(location: Location?, options: Map<String?, Any?>): Boolean {
    if (location == null) {
      return false
    }
    val maxAge = if (options.containsKey("maxAge")) {
      options["maxAge"] as Double
    } else {
      Double.MAX_VALUE
    }
    val requiredAccuracy = if (options.containsKey("requiredAccuracy")) {
      options["requiredAccuracy"] as Double
    } else {
      Double.MAX_VALUE
    }
    val timeDiff = (System.currentTimeMillis() - location.time).toDouble()
    return timeDiff <= maxAge && location.accuracy <= requiredAccuracy
  }

  //endregion
  //region private methods
  private fun getAccuracyFromOptions(options: Map<String?, Any?>): Int {
    return if (options.containsKey("accuracy")) {
      (options["accuracy"] as Number).toInt()
    } else {
      LocationModule.ACCURACY_BALANCED
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

  private fun mapAccuracyToPriority(accuracy: Int): Int {
    return when (accuracy) {
      LocationModule.ACCURACY_BEST_FOR_NAVIGATION,
      LocationModule.ACCURACY_HIGHEST,
      LocationModule.ACCURACY_HIGH ->
        LocationRequest.PRIORITY_HIGH_ACCURACY
      LocationModule.ACCURACY_BALANCED,
      LocationModule.ACCURACY_LOW ->
        LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
      LocationModule.ACCURACY_LOWEST ->
        LocationRequest.PRIORITY_LOW_POWER
      else ->
        LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
    }
  } //endregion
}
