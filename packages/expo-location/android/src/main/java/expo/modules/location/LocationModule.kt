// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.location

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentSender.SendIntentException
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.util.Log
import androidx.annotation.ChecksSdkIntAtLeast
import androidx.annotation.RequiresApi
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationAvailability
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.LocationSettingsRequest
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.location.LocationHelpers.addressToBundle
import expo.modules.location.LocationHelpers.hasNetworkProviderEnabled
import expo.modules.location.LocationHelpers.headingToBundle
import expo.modules.location.LocationHelpers.isAnyProviderAvailable
import expo.modules.location.LocationHelpers.isLocationValid
import expo.modules.location.LocationHelpers.locationToBundle
import expo.modules.location.LocationHelpers.locationToCoordsBundle
import expo.modules.location.LocationHelpers.prepareLocationRequest
import expo.modules.location.LocationHelpers.requestContinuousUpdates
import expo.modules.location.LocationHelpers.requestSingleLocation
import expo.modules.location.exceptions.LocationBackgroundUnauthorizedException
import expo.modules.location.exceptions.LocationRequestRejectedException
import expo.modules.location.exceptions.LocationSettingsUnsatisfiedException
import expo.modules.location.exceptions.LocationUnauthorizedException
import expo.modules.location.exceptions.LocationUnavailableException
import expo.modules.location.taskConsumers.GeofencingTaskConsumer
import expo.modules.location.taskConsumers.LocationTaskConsumer
import expo.modules.location.taskConsumers.LocationTaskConsumer.Companion.shouldUseForegroundService
import io.nlopez.smartlocation.SmartLocation
import io.nlopez.smartlocation.geocoding.utils.LocationAddress
import io.nlopez.smartlocation.location.config.LocationParams
import org.unimodules.interfaces.taskManager.TaskManagerInterface
import kotlin.math.abs

class LocationModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), LifecycleEventListener, SensorEventListener, ActivityEventListener {
  override fun getName() = "ExpoLocation"

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  private var sensorManager: SensorManager? = null
  private var geofield: GeomagneticField? = null
  private val locationProvider: FusedLocationProviderClient by lazy {
    LocationServices.getFusedLocationProviderClient(context)
  }
  private val locationCallbacks: MutableMap<Int, LocationCallback> = HashMap()
  private val locationRequests: MutableMap<Int, LocationRequest> = HashMap()

  private val pendingLocationRequests: MutableList<LocationActivityResultListener> = ArrayList()

  // modules
  private val eventEmitter: EventEmitter by moduleRegistry()
  private val uiManager: UIManager by moduleRegistry()
  private val permissionsManager: Permissions by moduleRegistry()
  private val taskManager: TaskManagerInterface by moduleRegistry()
  private val activityProvider: ActivityProvider by moduleRegistry()

  private var gravity: FloatArray? = null
  private var geomagnetic: FloatArray? = null
  private var headingId = 0
  private var lastAzimuth = 0f
  private var accuracy = 0
  private var lastUpdate: Long = 0
  private var geocoderPaused = false

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  //region Expo methods

  //region Expo methods
  @Deprecated("")
  @ExpoMethod
  fun requestPermissionsAsync(promise: Promise) {
    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
      permissionsManager.askForPermissions(
        { result: Map<String, PermissionsResponse> ->
          promise.resolve(handleLegacyPermissions(result))
        },
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.ACCESS_BACKGROUND_LOCATION
      )
    } else {
      requestForegroundPermissionsAsync(promise)
    }
  }

  @Deprecated("")
  @ExpoMethod
  fun getPermissionsAsync(promise: Promise) {
    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
      permissionsManager.getPermissions(
        { result: Map<String, PermissionsResponse> ->
          promise.resolve(handleLegacyPermissions(result))
        },
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.ACCESS_BACKGROUND_LOCATION
      )
    } else {
      getForegroundPermissionsAsync(promise)
    }
  }

  @ExpoMethod
  fun requestForegroundPermissionsAsync(promise: Promise) {
    permissionsManager.askForPermissions(
      { result: Map<String, PermissionsResponse> ->
        promise.resolve(handleForegroundLocationPermissions(result))
      },
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    )
  }

  @ExpoMethod
  fun requestBackgroundPermissionsAsync(promise: Promise) {
    if (!isBackgroundPermissionInManifest()) {
      promise.reject("ERR_NO_PERMISSIONS", "You need to add `ACCESS_BACKGROUND_LOCATION` to the AndroidManifest.")
      return
    }
    if (!shouldAskBackgroundPermissions()) {
      requestForegroundPermissionsAsync(promise)
      return
    }
    permissionsManager.askForPermissions(
      { result: Map<String, PermissionsResponse> ->
        promise.resolve(handleBackgroundLocationPermissions(result))
      },
      Manifest.permission.ACCESS_BACKGROUND_LOCATION
    )
  }

  @ExpoMethod
  fun getForegroundPermissionsAsync(promise: Promise) {
    permissionsManager.getPermissions(
      { result: Map<String, PermissionsResponse> ->
        promise.resolve(handleForegroundLocationPermissions(result))
      },
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    )
  }

  @ExpoMethod
  fun getBackgroundPermissionsAsync(promise: Promise) {
    if (!isBackgroundPermissionInManifest()) {
      promise.reject("ERR_NO_PERMISSIONS", "You need to add `ACCESS_BACKGROUND_LOCATION` to the AndroidManifest.")
      return
    }
    if (!shouldAskBackgroundPermissions()) {
      getForegroundPermissionsAsync(promise)
      return
    }
    permissionsManager.getPermissions(
      { result: Map<String, PermissionsResponse> ->
        promise.resolve(handleBackgroundLocationPermissions(result))
      },
      Manifest.permission.ACCESS_BACKGROUND_LOCATION
    )
  }

  /**
   * Resolves to the last known position if it is available and matches given requirements or null otherwise.
   */
  @ExpoMethod
  fun getLastKnownPositionAsync(options: Map<String?, Any?>, promise: Promise) {
    // Check for permissions
    if (isMissingForegroundPermissions()) {
      promise.reject(LocationUnauthorizedException())
      return
    }
    getLastKnownLocation { location: Location? ->
      if (isLocationValid(location, options)) {
        promise.resolve(locationToBundle(location, Bundle::class.java))
      } else {
        promise.resolve(null)
      }
    }
  }

  /**
   * Requests for the current position. Depending on given accuracy, it may take some time to resolve.
   * If you don't need an up-to-date location see `getLastKnownPosition`.
   */
  @ExpoMethod
  fun getCurrentPositionAsync(options: Map<String?, Any?>, promise: Promise) {
    // Read options
    val locationRequest = prepareLocationRequest(options)
    val showUserSettingsDialog = !options.containsKey(SHOW_USER_SETTINGS_DIALOG_KEY) ||
      options[SHOW_USER_SETTINGS_DIALOG_KEY] as Boolean

    // Check for permissions
    if (isMissingForegroundPermissions()) {
      promise.reject(LocationUnauthorizedException())
      return
    }
    if (hasNetworkProviderEnabled(context) || !showUserSettingsDialog) {
      requestSingleLocation(this, locationRequest, promise)
    } else {
      // Pending requests can ask the user to turn on improved accuracy mode in user's settings.
      addPendingLocationRequest(
        locationRequest,
        object : LocationActivityResultListener {
          override fun onResult(resultCode: Int) {
            if (resultCode == Activity.RESULT_OK) {
              requestSingleLocation(this@LocationModule, locationRequest, promise)
            } else {
              promise.reject(LocationSettingsUnsatisfiedException())
            }
          }
        }
      )
    }
  }

  @ExpoMethod
  fun getProviderStatusAsync(promise: Promise) {
    val state = SmartLocation.with(context).location().state()
    promise.resolve(
      Bundle().apply {
        putBoolean("locationServicesEnabled", state.locationServicesEnabled()) // If location is off
        putBoolean("gpsAvailable", state.isGpsAvailable) // If GPS provider is enabled
        putBoolean("networkAvailable", state.isNetworkAvailable) // If network provider is enabled
        putBoolean("passiveAvailable", state.isPassiveAvailable) // If passive provider is enabled
        putBoolean("backgroundModeEnabled", state.locationServicesEnabled())
      }
    ) // background mode is always available if location services are on
  }

  // Start Compass Module
  @ExpoMethod
  fun watchDeviceHeading(watchId: Int, promise: Promise) {
    sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager?
    headingId = watchId
    startHeadingUpdate()
    promise.resolve(null)
  }

  @ExpoMethod
  fun watchPositionImplAsync(watchId: Int, options: Map<String?, Any?>, promise: Promise) {
    // Check for permissions
    if (isMissingForegroundPermissions()) {
      promise.reject(LocationUnauthorizedException())
      return
    }
    val locationRequest = prepareLocationRequest(options)
    val showUserSettingsDialog = !options.containsKey(SHOW_USER_SETTINGS_DIALOG_KEY) ||
      options[SHOW_USER_SETTINGS_DIALOG_KEY] as Boolean

    if (hasNetworkProviderEnabled(context) || !showUserSettingsDialog) {
      requestContinuousUpdates(this, locationRequest, watchId, promise)
    } else {
      // Pending requests can ask the user to turn on improved accuracy mode in user's settings.
      addPendingLocationRequest(
        locationRequest,
        object : LocationActivityResultListener {
          override fun onResult(resultCode: Int) {
            if (resultCode == Activity.RESULT_OK) {
              requestContinuousUpdates(this@LocationModule, locationRequest, watchId, promise)
            } else {
              promise.reject(LocationSettingsUnsatisfiedException())
            }
          }
        }
      )
    }
  }

  @ExpoMethod
  fun removeWatchAsync(watchId: Int, promise: Promise) {
    if (isMissingForegroundPermissions()) {
      promise.reject(LocationUnauthorizedException())
      return
    }

    // Check if we want to stop watching location or compass
    if (watchId == headingId) {
      destroyHeadingWatch()
    } else {
      removeLocationUpdatesForRequest(watchId)
    }
    promise.resolve(null)
  }

  @ExpoMethod
  fun geocodeAsync(address: String?, promise: Promise) {
    if (geocoderPaused) {
      promise.reject("E_CANNOT_GEOCODE", "Geocoder is not running.")
      return
    }
    if (isMissingForegroundPermissions()) {
      promise.reject(LocationUnauthorizedException())
      return
    }
    if (Geocoder.isPresent()) {
      SmartLocation.with(context).geocoding()
        .direct(address!!) { _, list: List<LocationAddress> ->
          val results: MutableList<Bundle> = ArrayList(list.size)
          list.forEach { locationAddress ->
            val coords = locationToCoordsBundle(locationAddress.location, Bundle::class.java)
            if (coords != null) {
              results.add(coords)
            }
          }
          SmartLocation.with(context).geocoding().stop()
          promise.resolve(results)
        }
    } else {
      promise.reject("E_NO_GEOCODER", "Geocoder service is not available for this device.")
    }
  }

  @ExpoMethod
  fun reverseGeocodeAsync(locationMap: Map<String?, Any?>, promise: Promise) {
    if (geocoderPaused) {
      promise.reject("E_CANNOT_GEOCODE", "Geocoder is not running.")
      return
    }
    if (isMissingForegroundPermissions()) {
      promise.reject(LocationUnauthorizedException())
      return
    }
    val location = Location("")
    location.latitude = locationMap["latitude"] as Double
    location.longitude = locationMap["longitude"] as Double
    if (Geocoder.isPresent()) {
      SmartLocation.with(context).geocoding()
        .reverse(location) { _, addresses: List<Address> ->
          val results: MutableList<Bundle> = ArrayList(addresses.size)
          addresses.mapTo(results) { addressToBundle(it) }
          SmartLocation.with(context).geocoding().stop()
          promise.resolve(results)
        }
    } else {
      promise.reject("E_NO_GEOCODER", "Geocoder service is not available for this device.")
    }
  }

  @ExpoMethod
  fun enableNetworkProviderAsync(promise: Promise) {
    if (hasNetworkProviderEnabled(context)) {
      promise.resolve(null)
      return
    }
    val locationRequest = prepareLocationRequest(HashMap())
    addPendingLocationRequest(
      locationRequest,
      object : LocationActivityResultListener {
        override fun onResult(resultCode: Int) {
          if (resultCode == Activity.RESULT_OK) {
            promise.resolve(null)
          } else {
            promise.reject(LocationSettingsUnsatisfiedException())
          }
        }
      }
    )
  }

  @ExpoMethod
  fun hasServicesEnabledAsync(promise: Promise) {
    val servicesEnabled = isAnyProviderAvailable(context)
    promise.resolve(servicesEnabled)
  }

  //region Background location
  @ExpoMethod
  fun startLocationUpdatesAsync(taskName: String?, options: Map<String, Any?>, promise: Promise) {
    val shouldUseForegroundService = shouldUseForegroundService(options)

    // There are two ways of starting this service.
    // 1. As a background location service, this requires the background location permission.
    // 2. As a user-initiated foreground service with notification, this does NOT require the background location permission.
    if (!shouldUseForegroundService && isMissingBackgroundPermissions()) {
      promise.reject(LocationBackgroundUnauthorizedException())
      return
    }
    try {
      taskManager.registerTask(taskName, LocationTaskConsumer::class.java, options)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun stopLocationUpdatesAsync(taskName: String?, promise: Promise) {
    try {
      taskManager.unregisterTask(taskName, LocationTaskConsumer::class.java)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun hasStartedLocationUpdatesAsync(taskName: String?, promise: Promise) {
    promise.resolve(taskManager.taskHasConsumerOfClass(taskName, LocationTaskConsumer::class.java))
  }

  //endregion Background location
  //region Geofencing
  @ExpoMethod
  fun startGeofencingAsync(taskName: String?, options: Map<String?, Any?>?, promise: Promise) {
    if (isMissingBackgroundPermissions()) {
      promise.reject(LocationBackgroundUnauthorizedException())
      return
    }
    try {
      taskManager.registerTask(taskName, GeofencingTaskConsumer::class.java, options)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun stopGeofencingAsync(taskName: String?, promise: Promise) {
    if (isMissingBackgroundPermissions()) {
      promise.reject(LocationBackgroundUnauthorizedException())
      return
    }
    try {
      taskManager.unregisterTask(taskName, GeofencingTaskConsumer::class.java)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun hasStartedGeofencingAsync(taskName: String?, promise: Promise) {
    if (isMissingBackgroundPermissions()) {
      promise.reject(LocationBackgroundUnauthorizedException())
      return
    }
    promise.resolve(taskManager.taskHasConsumerOfClass(taskName, GeofencingTaskConsumer::class.java))
  }

  //endregion Geofencing
  //endregion Expo methods
  //region public methods
  fun requestLocationUpdates(locationRequest: LocationRequest, requestId: Int?, callbacks: LocationRequestCallbacks) {
    val locationCallback: LocationCallback = object : LocationCallback() {
      var isLocationAvailable = false
      override fun onLocationResult(locationResult: LocationResult?) {
        val location = locationResult?.lastLocation
        if (location != null) {
          callbacks.onLocationChanged(location)
        } else if (!isLocationAvailable) {
          callbacks.onLocationError(LocationUnavailableException())
        }
      }

      override fun onLocationAvailability(locationAvailability: LocationAvailability) {
        isLocationAvailable = locationAvailability.isLocationAvailable
      }
    }
    if (requestId != null) {
      // Save location callback and request so we will be able to pause/resume receiving updates.
      locationCallbacks[requestId] = locationCallback
      locationRequests[requestId] = locationRequest
    }
    val looper = Looper.myLooper()
    if (looper != null) {
      try {
        locationProvider.requestLocationUpdates(locationRequest, locationCallback, looper)
        callbacks.onRequestSuccess()
      } catch (e: SecurityException) {
        callbacks.onRequestFailed(LocationRequestRejectedException(e))
      }
    }
  }

  //region private methods
  /**
   * Checks whether all required permissions have been granted by the user.
   */
  private fun isMissingForegroundPermissions() =
    !permissionsManager.hasGrantedPermissions(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    )

  /**
   * Checks if the background location permission is granted by the user.
   */
  private fun isMissingBackgroundPermissions() =
    (
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
        !permissionsManager.hasGrantedPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
      )

  /**
   * Gets the best most recent location found by the provider.
   */
  private fun getLastKnownLocation(callback: (location: Location?) -> Unit) {
    try {
      locationProvider.lastLocation
        .addOnSuccessListener { location: Location? -> callback(location) }
        .addOnCanceledListener { callback(null) }
        .addOnFailureListener { callback(null) }
    } catch (e: SecurityException) {
      callback(null)
    }
  }

  private fun addPendingLocationRequest(locationRequest: LocationRequest, listener: LocationActivityResultListener) {
    // Add activity result listener to an array of pending requests.
    pendingLocationRequests.add(listener)

    // If it's the first pending request, let's ask the user to turn on high accuracy location.
    if (pendingLocationRequests.size == 1) {
      resolveUserSettingsForRequest(locationRequest)
    }
  }

  /**
   * Triggers system's dialog to ask the user to enable settings required for given location request.
   */
  private fun resolveUserSettingsForRequest(locationRequest: LocationRequest) {
    val activity = activityProvider.currentActivity
    if (activity == null) {
      // Activity not found. It could have been called in a headless mode.
      executePendingRequests(Activity.RESULT_CANCELED)
      return
    }
    val builder = LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
    val client = LocationServices.getSettingsClient(context)
    val task = client.checkLocationSettings(builder.build())
    task.addOnSuccessListener {
      // All location settings requirements are satisfied.
      executePendingRequests(Activity.RESULT_OK)
    }
    task.addOnFailureListener { e: Exception ->
      val statusCode = (e as ApiException).statusCode
      if (statusCode == CommonStatusCodes.RESOLUTION_REQUIRED) {
        // Location settings are not satisfied, but this can be fixed by showing the user a dialog.
        // Show the dialog by calling startResolutionForResult(), and check the result in onActivityResult().
        try {
          val resolvable = e as ResolvableApiException
          uiManager.registerActivityEventListener(this@LocationModule)
          resolvable.startResolutionForResult(activity, CHECK_SETTINGS_REQUEST_CODE)
        } catch (sendEx: SendIntentException) {
          // Ignore the error.
          executePendingRequests(Activity.RESULT_CANCELED)
        }
      } else { // Location settings are not satisfied. However, we have no way to fix the settings so we won't show the dialog.
        executePendingRequests(Activity.RESULT_CANCELED)
      }
    }
  }

  private fun pauseLocationUpdatesForRequest(requestId: Int) {
    val locationCallback = locationCallbacks[requestId]
    if (locationCallback != null) {
      locationProvider.removeLocationUpdates(locationCallback)
    }
  }

  private fun resumeLocationUpdates() {
    val locationClient = locationProvider
    locationCallbacks.keys.forEach { requestId ->
      val locationCallback = locationCallbacks[requestId]
      val locationRequest = locationRequests[requestId]
      val looper = Looper.myLooper()
      if (locationCallback != null && locationRequest != null && looper != null) {
        try {
          locationClient.requestLocationUpdates(locationRequest, locationCallback, looper)
        } catch (e: SecurityException) {
          Log.e(TAG, "Error occurred while resuming location updates: $e")
        }
      }
    }
  }

  private fun removeLocationUpdatesForRequest(requestId: Int) {
    pauseLocationUpdatesForRequest(requestId)
    locationCallbacks.remove(requestId)
    locationRequests.remove(requestId)
  }

  fun sendLocationResponse(watchId: Int, response: Bundle) {
    response.putInt("watchId", watchId)
    eventEmitter.emit(LOCATION_EVENT_NAME, response)
  }

  private fun executePendingRequests(resultCode: Int) {
    // Propagate result to pending location requests.
    pendingLocationRequests.forEach { listener ->
      listener.onResult(resultCode)
    }
    pendingLocationRequests.clear()
  }

  private fun startHeadingUpdate() {
    val internalSensorManager = sensorManager ?: return
    val locationControl = SmartLocation.with(context).location().oneFix().config(LocationParams.BEST_EFFORT)
    val currLoc = locationControl.lastLocation
    if (currLoc != null) {
      geofield = GeomagneticField(
        currLoc.latitude.toFloat(),
        currLoc.longitude.toFloat(),
        currLoc.altitude.toFloat(),
        System.currentTimeMillis()
      )
    } else {
      locationControl.start { location: Location ->
        geofield = GeomagneticField(
          location.latitude.toFloat(),
          location.longitude.toFloat(),
          location.altitude.toFloat(),
          System.currentTimeMillis()
        )
      }
    }
    internalSensorManager.registerListener(
      this, internalSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD),
      SensorManager.SENSOR_DELAY_NORMAL
    )
    internalSensorManager.registerListener(this, internalSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER), SensorManager.SENSOR_DELAY_NORMAL)
  }

  private fun sendUpdate() {
    @Suppress("LocalVariableName")
    val R = FloatArray(9)

    @Suppress("LocalVariableName")
    val I = FloatArray(9)
    val success = SensorManager.getRotationMatrix(R, I, gravity, geomagnetic)
    if (success) {
      val orientation = FloatArray(3)
      SensorManager.getOrientation(R, orientation)

      // Make sure Delta is big enough to warrant an update
      // Currently: 50ms and ~2 degrees of change (android has a lot of useless updates block up the sending)
      if (abs(orientation[0] - lastAzimuth) > DEGREE_DELTA && System.currentTimeMillis() - lastUpdate > TIME_DELTA) {
        lastAzimuth = orientation[0]
        lastUpdate = System.currentTimeMillis()
        val magneticNorth = calcMagNorth(orientation[0])
        val trueNorth = calcTrueNorth(magneticNorth)

        // Write data to send back to React
        val heading = headingToBundle(trueNorth.toDouble(), magneticNorth.toDouble(), accuracy)
        val response = Bundle().apply {
          putInt("watchId", headingId)
          putBundle("heading", heading)
        }
        eventEmitter.emit(HEADING_EVENT_NAME, response)
      }
    }
  }

  private fun calcMagNorth(azimuth: Float): Float {
    val azimuthDeg = Math.toDegrees(azimuth.toDouble()).toFloat()
    return (azimuthDeg + 360) % 360
  }

  private fun calcTrueNorth(magNorth: Float): Float {
    // Need to request geo location info to calculate true north
    return if (isMissingForegroundPermissions() || geofield == null) {
      (-1).toFloat()
    } else {
      magNorth + geofield!!.declination
    }
  }

  private fun stopHeadingWatch() {
    if (sensorManager == null) {
      return
    }
    sensorManager!!.unregisterListener(this)
  }

  private fun destroyHeadingWatch() {
    stopHeadingWatch()
    sensorManager = null
    gravity = null
    geomagnetic = null
    geofield = null
    headingId = 0
    lastAzimuth = 0f
    accuracy = 0
  }

  private fun startWatching() {
    // if permissions not granted it won't work anyway, but this can be invoked when permission dialog disappears
    if (!isMissingForegroundPermissions()) {
      geocoderPaused = false
    }

    // Resume paused location updates
    resumeLocationUpdates()
  }

  private fun stopWatching() {
    // if permissions not granted it won't work anyway, but this can be invoked when permission dialog appears
    if (Geocoder.isPresent() && !isMissingForegroundPermissions()) {
      SmartLocation.with(context).geocoding().stop()
      geocoderPaused = true
    }
    locationCallbacks.keys.forEach { requestId ->
      pauseLocationUpdatesForRequest(requestId)
    }
  }

  private fun handleForegroundLocationPermissions(result: Map<String, PermissionsResponse>): Bundle {
    val accessFineLocation = result[Manifest.permission.ACCESS_FINE_LOCATION]
    val accessCoarseLocation = result[Manifest.permission.ACCESS_COARSE_LOCATION]
    accessFineLocation!!
    accessCoarseLocation!!
    var status = PermissionsStatus.UNDETERMINED
    var accuracy = "none"
    val canAskAgain = accessCoarseLocation.canAskAgain && accessFineLocation.canAskAgain
    if (accessFineLocation.status == PermissionsStatus.GRANTED) {
      accuracy = "fine"
      status = PermissionsStatus.GRANTED
    } else if (accessCoarseLocation.status == PermissionsStatus.GRANTED) {
      accuracy = "coarse"
      status = PermissionsStatus.GRANTED
    } else if (
      accessFineLocation.status == PermissionsStatus.DENIED &&
      accessCoarseLocation.status == PermissionsStatus.DENIED
    ) {
      status = PermissionsStatus.DENIED
    }
    return Bundle().apply {
      putString(PermissionsResponse.STATUS_KEY, status.status)
      putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
      putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, canAskAgain)
      putBoolean(PermissionsResponse.GRANTED_KEY, status == PermissionsStatus.GRANTED)
      val androidBundle = Bundle().apply {
        putString("scoped", accuracy) // deprecated
        putString("accuracy", accuracy)
      }
      putBundle("android", androidBundle)
    }
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  private fun handleBackgroundLocationPermissions(result: Map<String, PermissionsResponse>) =
    Bundle().apply {
      val accessBackgroundLocation = result[Manifest.permission.ACCESS_BACKGROUND_LOCATION]!!
      val status = accessBackgroundLocation.status
      val canAskAgain = accessBackgroundLocation.canAskAgain
      putString(PermissionsResponse.STATUS_KEY, status.status)
      putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
      putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, canAskAgain)
      putBoolean(PermissionsResponse.GRANTED_KEY, status == PermissionsStatus.GRANTED)
    }

  @RequiresApi(Build.VERSION_CODES.Q)
  private fun handleLegacyPermissions(result: Map<String, PermissionsResponse>): Bundle {
    val accessFineLocation = result[Manifest.permission.ACCESS_FINE_LOCATION]!!
    val accessCoarseLocation = result[Manifest.permission.ACCESS_COARSE_LOCATION]!!
    val backgroundLocation = result[Manifest.permission.ACCESS_BACKGROUND_LOCATION]!!
    var status = PermissionsStatus.UNDETERMINED
    var accuracy = "none"
    val canAskAgain = accessCoarseLocation.canAskAgain && accessFineLocation.canAskAgain
    if (accessFineLocation.status == PermissionsStatus.GRANTED) {
      accuracy = "fine"
      status = PermissionsStatus.GRANTED
    } else if (accessCoarseLocation.status == PermissionsStatus.GRANTED) {
      accuracy = "coarse"
      status = PermissionsStatus.GRANTED
    } else if (
      accessFineLocation.status == PermissionsStatus.DENIED &&
      accessCoarseLocation.status == PermissionsStatus.DENIED
    ) {
      status = PermissionsStatus.DENIED
    }
    val resultBundle = Bundle()
    resultBundle.putString(PermissionsResponse.STATUS_KEY, status.status)
    resultBundle.putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
    resultBundle.putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, canAskAgain)
    resultBundle.putBoolean(PermissionsResponse.GRANTED_KEY, status == PermissionsStatus.GRANTED)
    val androidBundle = Bundle()
    androidBundle.putString("accuracy", accuracy)
    resultBundle.putBundle("android", androidBundle)
    return resultBundle
  }

  /**
   * Check if we need to request background location permission separately.
   *
   * @see `https://medium.com/swlh/request-location-permission-correctly-in-android-11-61afe95a11ad`
   */
  @ChecksSdkIntAtLeast(api = Build.VERSION_CODES.Q)
  private fun shouldAskBackgroundPermissions(): Boolean {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
  }

  private fun isBackgroundPermissionInManifest() =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      permissionsManager.isPermissionPresentInManifest(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    } else {
      true
    }

  //endregion
  //region SensorEventListener
  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
      gravity = event.values
    } else if (event.sensor.type == Sensor.TYPE_MAGNETIC_FIELD) {
      geomagnetic = event.values
    }
    if (gravity != null && geomagnetic != null) {
      sendUpdate()
    }
  }

  // Android returns 4 different values for accuracy
  // 3: high accuracy, 2: medium, 1: low, 0: none
  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
    this.accuracy = accuracy
  }

  //endregion
  //region ActivityEventListener
  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent) {
    if (requestCode != CHECK_SETTINGS_REQUEST_CODE) {
      return
    }
    executePendingRequests(resultCode)
    uiManager.unregisterActivityEventListener(this)
  }

  override fun onNewIntent(intent: Intent) {}

  //endregion
  //region LifecycleEventListener
  override fun onHostResume() {
    startWatching()
    startHeadingUpdate()
  }

  override fun onHostPause() {
    stopWatching()
    stopHeadingWatch()
  }

  override fun onHostDestroy() {
    stopWatching()
    stopHeadingWatch()
  } //endregion

  companion object {
    private val TAG = LocationModule::class.java.simpleName
    private const val LOCATION_EVENT_NAME = "Expo.locationChanged"
    private const val HEADING_EVENT_NAME = "Expo.headingChanged"
    private const val CHECK_SETTINGS_REQUEST_CODE = 42
    private const val SHOW_USER_SETTINGS_DIALOG_KEY = "mayShowUserSettingsDialog"
    const val ACCURACY_LOWEST = 1
    const val ACCURACY_LOW = 2
    const val ACCURACY_BALANCED = 3
    const val ACCURACY_HIGH = 4
    const val ACCURACY_HIGHEST = 5
    const val ACCURACY_BEST_FOR_NAVIGATION = 6
    const val GEOFENCING_EVENT_ENTER = 1
    const val GEOFENCING_EVENT_EXIT = 2
    const val GEOFENCING_REGION_STATE_UNKNOWN = 0
    const val GEOFENCING_REGION_STATE_INSIDE = 1
    const val GEOFENCING_REGION_STATE_OUTSIDE = 2
    private const val DEGREE_DELTA = 0.0355 // in radians, about 2 degrees
    private const val TIME_DELTA = 50f // in milliseconds
  }
}
