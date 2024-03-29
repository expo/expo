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
import android.location.Geocoder
import android.location.Location
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.util.Log
import androidx.annotation.ChecksSdkIntAtLeast
import androidx.core.os.bundleOf
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
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.location.records.GeocodeResponse
import expo.modules.location.records.GeofencingOptions
import expo.modules.location.records.Heading
import expo.modules.location.records.HeadingEventResponse
import expo.modules.location.records.LocationLastKnownOptions
import expo.modules.location.records.LocationOptions
import expo.modules.location.records.LocationProviderStatus
import expo.modules.location.records.LocationResponse
import expo.modules.location.records.LocationTaskOptions
import expo.modules.location.records.PermissionDetailsLocationAndroid
import expo.modules.location.records.PermissionRequestResponse
import expo.modules.location.records.ReverseGeocodeLocation
import expo.modules.location.records.ReverseGeocodeResponse
import expo.modules.location.taskConsumers.GeofencingTaskConsumer
import expo.modules.location.taskConsumers.LocationTaskConsumer
import io.nlopez.smartlocation.SmartLocation
import io.nlopez.smartlocation.geocoding.utils.LocationAddress
import io.nlopez.smartlocation.location.config.LocationParams
import java.util.Locale
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlin.math.abs

class LocationModule : Module(), LifecycleEventListener, SensorEventListener, ActivityEventListener {
  private var mGeofield: GeomagneticField? = null
  private val mLocationCallbacks = HashMap<Int, LocationCallback>()
  private val mLocationRequests = HashMap<Int, LocationRequest>()
  private var mPendingLocationRequests = ArrayList<LocationActivityResultListener>()
  private lateinit var mContext: Context
  private lateinit var mSensorManager: SensorManager
  private lateinit var mUIManager: UIManager
  private lateinit var mLocationProvider: FusedLocationProviderClient
  private lateinit var mActivityProvider: ActivityProvider

  private var mGravity: FloatArray = FloatArray(9)
  private var mGeomagnetic: FloatArray = FloatArray(9)
  private var mHeadingId = 0
  private var mLastAzimuth = 0f
  private var mAccuracy = 0
  private var mLastUpdate: Long = 0
  private var mGeocoderPaused = false

  private val mTaskManager: TaskManagerInterface by lazy {
    return@lazy appContext.legacyModule<TaskManagerInterface>()
      ?: throw TaskManagerNotFoundException()
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoLocation")

    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      mUIManager = appContext.legacyModule<UIManager>() ?: throw MissingUIManagerException()
      mActivityProvider = appContext.legacyModule<ActivityProvider>()
        ?: throw MissingActivityManagerException()
      mLocationProvider = LocationServices.getFusedLocationProviderClient(mContext)
      mSensorManager = mContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        ?: throw SensorManagerUnavailable()
    }

    Events(HEADING_EVENT_NAME, LOCATION_EVENT_NAME)

    // Deprecated
    AsyncFunction("requestPermissionsAsync") Coroutine { ->
      val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()

      return@Coroutine if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
        LocationHelpers.askForPermissionsWithPermissionsManager(
          permissionsManager,
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION,
          Manifest.permission.ACCESS_BACKGROUND_LOCATION
        )
      } else {
        LocationHelpers.askForPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
      }
    }

    // Deprecated
    AsyncFunction("getPermissionsAsync") Coroutine { ->
      val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()

      return@Coroutine if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
        LocationHelpers.getPermissionsWithPermissionsManager(
          permissionsManager,
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION,
          Manifest.permission.ACCESS_BACKGROUND_LOCATION
        )
      } else {
        getForegroundPermissionsAsync()
      }
    }

    AsyncFunction("requestForegroundPermissionsAsync") Coroutine { ->
      val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()

      LocationHelpers.askForPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
      // We aren't using the values returned above, because we need to check if the user has provided fine location permissions
      return@Coroutine getForegroundPermissionsAsync()
    }

    AsyncFunction("requestBackgroundPermissionsAsync") Coroutine { ->
      return@Coroutine requestBackgroundPermissionsAsync()
    }

    AsyncFunction("getForegroundPermissionsAsync") Coroutine { ->
      return@Coroutine getForegroundPermissionsAsync()
    }

    AsyncFunction("getBackgroundPermissionsAsync") Coroutine { ->
      return@Coroutine getBackgroundPermissionsAsync()
    }

    AsyncFunction("getLastKnownPositionAsync") Coroutine { options: LocationLastKnownOptions ->
      return@Coroutine getLastKnownPositionAsync(options)
    }

    AsyncFunction("getCurrentPositionAsync") { options: LocationOptions, promise: Promise ->
      return@AsyncFunction getCurrentPositionAsync(options, promise)
    }

    AsyncFunction<LocationProviderStatus>("getProviderStatusAsync") {
      val state = SmartLocation.with(mContext).location().state()

      return@AsyncFunction LocationProviderStatus().apply {
        backgroundModeEnabled = state.locationServicesEnabled()
        gpsAvailable = state.isGpsAvailable
        networkAvailable = state.isNetworkAvailable
        locationServicesEnabled = state.locationServicesEnabled()
        passiveAvailable = state.isPassiveAvailable
      }
    }

    AsyncFunction("watchDeviceHeading") { watchId: Int ->
      mHeadingId = watchId
      startHeadingUpdate()
      return@AsyncFunction
    }

    AsyncFunction("watchPositionImplAsync") { watchId: Int, options: LocationOptions, promise: Promise ->
      // Check for permissions
      if (isMissingForegroundPermissions()) {
        promise.reject(LocationUnauthorizedException())
        return@AsyncFunction
      }

      val locationRequest = LocationHelpers.prepareLocationRequest(options)
      val showUserSettingsDialog = options.mayShowUserSettingsDialog

      if (LocationHelpers.hasNetworkProviderEnabled(mContext) || !showUserSettingsDialog) {
        LocationHelpers.requestContinuousUpdates(this@LocationModule, locationRequest, watchId, promise)
      } else {
        // Pending requests can ask the user to turn on improved accuracy mode in user's settings.
        addPendingLocationRequest(
          locationRequest,
          object : LocationActivityResultListener {
            override fun onResult(resultCode: Int) {
              if (resultCode == Activity.RESULT_OK) {
                LocationHelpers.requestContinuousUpdates(this@LocationModule, locationRequest, watchId, promise)
              } else {
                promise.reject(LocationSettingsUnsatisfiedException())
              }
            }
          }
        )
      }
    }

    AsyncFunction("removeWatchAsync") { watchId: Int ->
      if (isMissingForegroundPermissions()) {
        throw LocationUnauthorizedException()
      }

      // Check if we want to stop watching location or compass
      if (watchId == mHeadingId) {
        destroyHeadingWatch()
      } else {
        removeLocationUpdatesForRequest(watchId)
      }
      return@AsyncFunction
    }

    AsyncFunction("geocodeAsync") Coroutine { address: String ->
      return@Coroutine geocode(address)
    }

    AsyncFunction("reverseGeocodeAsync") Coroutine { location: ReverseGeocodeLocation ->
      return@Coroutine reverseGeocode(location)
    }

    AsyncFunction("enableNetworkProviderAsync") Coroutine { ->
      if (LocationHelpers.hasNetworkProviderEnabled(mContext)) {
        return@Coroutine null
      }

      val locationRequest = LocationHelpers.prepareLocationRequest(LocationOptions())

      return@Coroutine suspendCoroutine<String?> { continuation ->
        addPendingLocationRequest(
          locationRequest,
          object : LocationActivityResultListener {
            override fun onResult(resultCode: Int) {
              if (resultCode == Activity.RESULT_OK) {
                continuation.resume(null)
              } else {
                continuation.resumeWithException(LocationSettingsUnsatisfiedException())
              }
            }
          }
        )
      }
    }

    AsyncFunction<Boolean>("hasServicesEnabledAsync") {
      return@AsyncFunction LocationHelpers.isAnyProviderAvailable(mContext)
    }

    AsyncFunction("startLocationUpdatesAsync") { taskName: String, options: LocationTaskOptions ->
      val shouldUseForegroundService = options.foregroundService != null

      if (isMissingForegroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }
      // There are two ways of starting this service.
      // 1. As a background location service, this requires the background location permission.
      // 2. As a user-initiated foreground service with notification, this does NOT require the background location permission.
      if (!shouldUseForegroundService && isMissingBackgroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }
      if (!AppForegroundedSingleton.isForegrounded && options.foregroundService != null) {
        throw ForegroundServiceStartNotAllowedException()
      }

      if (!hasForegroundServicePermissions()) {
        throw ForegroundServicePermissionsException()
      }

      mTaskManager.registerTask(taskName, LocationTaskConsumer::class.java, options.toMutableMap())
      return@AsyncFunction
    }

    AsyncFunction("stopLocationUpdatesAsync") { taskName: String ->
      mTaskManager.unregisterTask(taskName, LocationTaskConsumer::class.java)
      return@AsyncFunction
    }

    AsyncFunction("hasStartedLocationUpdatesAsync") { taskName: String ->
      return@AsyncFunction mTaskManager.taskHasConsumerOfClass(taskName, LocationTaskConsumer::class.java)
    }

    AsyncFunction("startGeofencingAsync") { taskName: String, options: GeofencingOptions ->
      if (isMissingBackgroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }

      mTaskManager.registerTask(taskName, GeofencingTaskConsumer::class.java, options.toMap())
      return@AsyncFunction
    }

    AsyncFunction("hasStartedGeofencingAsync") { taskName: String ->
      if (isMissingBackgroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }

      return@AsyncFunction mTaskManager.taskHasConsumerOfClass(taskName, GeofencingTaskConsumer::class.java)
    }

    AsyncFunction("stopGeofencingAsync") { taskName: String ->
      if (isMissingBackgroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }

      mTaskManager.unregisterTask(taskName, GeofencingTaskConsumer::class.java)
      return@AsyncFunction
    }

    OnActivityEntersForeground {
      AppForegroundedSingleton.isForegrounded = true
    }

    OnActivityEntersBackground {
      AppForegroundedSingleton.isForegrounded = false
    }
  }

  private suspend fun getForegroundPermissionsAsync(): PermissionRequestResponse {
    appContext.permissions?.let {
      val locationPermission = LocationHelpers.getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_COARSE_LOCATION)
      val fineLocationPermission = LocationHelpers.getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_FINE_LOCATION)

      var accuracy = "none"
      if (locationPermission.granted) {
        accuracy = "coarse"
      }
      if (fineLocationPermission.granted) {
        accuracy = "fine"
      }

      locationPermission.android = PermissionDetailsLocationAndroid(
        scope = accuracy,
        accuracy = accuracy
      )

      return locationPermission
    } ?: throw NoPermissionsModuleException()
  }

  private suspend fun requestBackgroundPermissionsAsync(): PermissionRequestResponse {
    if (!isBackgroundPermissionInManifest()) {
      throw NoPermissionInManifestException("ACCESS_BACKGROUND_LOCATION")
    }
    if (!shouldAskBackgroundPermissions()) {
      return getForegroundPermissionsAsync()
    }
    return appContext.permissions?.let {
      val permissionResponseBundle = LocationHelpers.askForPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
      PermissionRequestResponse(permissionResponseBundle)
    } ?: throw NoPermissionsModuleException()
  }

  private suspend fun getBackgroundPermissionsAsync(): PermissionRequestResponse {
    if (!isBackgroundPermissionInManifest()) {
      throw NoPermissionInManifestException("ACCESS_BACKGROUND_LOCATION")
    }
    if (!shouldAskBackgroundPermissions()) {
      return getForegroundPermissionsAsync()
    }
    appContext.permissions?.let {
      return LocationHelpers.getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    } ?: throw NoPermissionsModuleException()
  }

  /**
   * Resolves to the last known position if it is available and matches given requirements or null otherwise.
   */
  private suspend fun getLastKnownPositionAsync(options: LocationLastKnownOptions): LocationResponse? {
    // Check for permissions
    if (isMissingForegroundPermissions()) {
      throw LocationUnauthorizedException()
    }
    val lastKnownLocation = getLastKnownLocation() ?: return null

    if (LocationHelpers.isLocationValid(lastKnownLocation, options)) {
      return LocationResponse(lastKnownLocation)
    }
    return null
  }

  /**
   * Requests for the current position. Depending on given accuracy, it may take some time to resolve.
   * If you don't need an up-to-date location see `getLastKnownPosition`.
   */
  private fun getCurrentPositionAsync(options: LocationOptions, promise: Promise) {
    // Read options
    val locationRequest = LocationHelpers.prepareLocationRequest(options)
    val currentLocationRequest = LocationHelpers.prepareCurrentLocationRequest(options)
    val showUserSettingsDialog = options.mayShowUserSettingsDialog

    // Check for permissions
    if (isMissingForegroundPermissions()) {
      promise.reject(LocationUnauthorizedException())
      return
    }
    if (LocationHelpers.hasNetworkProviderEnabled(mContext) || !showUserSettingsDialog) {
      LocationHelpers.requestSingleLocation(mLocationProvider, currentLocationRequest, promise)
    } else {
      addPendingLocationRequest(
        locationRequest,
        object : LocationActivityResultListener {
          override fun onResult(resultCode: Int) {
            if (resultCode == Activity.RESULT_OK) {
              LocationHelpers.requestSingleLocation(mLocationProvider, currentLocationRequest, promise)
            } else {
              promise.reject(LocationSettingsUnsatisfiedException())
            }
          }
        }
      )
    }
  }

  fun requestLocationUpdates(locationRequest: LocationRequest, requestId: Int?, callbacks: LocationRequestCallbacks) {
    val locationProvider: FusedLocationProviderClient = mLocationProvider

    val locationCallback: LocationCallback = object : LocationCallback() {
      var isLocationAvailable = false

      override fun onLocationResult(locationResult: LocationResult) {
        val location = locationResult.lastLocation
        if (location != null) {
          callbacks.onLocationChanged(location)
        } else if (!isLocationAvailable) {
          callbacks.onLocationError(LocationUnavailableException())
        } else {
          callbacks.onRequestFailed(LocationUnknownException())
        }
      }

      override fun onLocationAvailability(locationAvailability: LocationAvailability) {
        isLocationAvailable = locationAvailability.isLocationAvailable
      }
    }

    if (requestId != null) {
      // Save location callback and request so we will be able to pause/resume receiving updates.
      mLocationCallbacks[requestId] = locationCallback
      mLocationRequests[requestId] = locationRequest
    }

    try {
      locationProvider.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
      callbacks.onRequestSuccess()
    } catch (e: SecurityException) {
      callbacks.onRequestFailed(LocationRequestRejectedException(e))
    }
  }

  private fun addPendingLocationRequest(locationRequest: LocationRequest, listener: LocationActivityResultListener) {
    // Add activity result listener to an array of pending requests.
    mPendingLocationRequests.add(listener)

    // If it's the first pending request, let's ask the user to turn on high accuracy location.
    if (mPendingLocationRequests.size == 1) {
      resolveUserSettingsForRequest(locationRequest)
    }
  }

  /**
   * Triggers system's dialog to ask the user to enable settings required for given location request.
   */
  private fun resolveUserSettingsForRequest(locationRequest: LocationRequest) {
    val activity = mActivityProvider.currentActivity
    if (activity == null) {
      // Activity not found. It could have been called in a headless mode.
      executePendingRequests(Activity.RESULT_CANCELED)
      return
    }
    val builder = LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
    val client = LocationServices.getSettingsClient(mContext)
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
          mUIManager.registerActivityEventListener(this@LocationModule)
          resolvable.startResolutionForResult(activity, CHECK_SETTINGS_REQUEST_CODE)
        } catch (e: SendIntentException) {
          // Ignore the error.
          executePendingRequests(Activity.RESULT_CANCELED)
        }
      } else { // Location settings are not satisfied. However, we have no way to fix the settings so we won't show the dialog.
        executePendingRequests(Activity.RESULT_CANCELED)
      }
    }
  }

  private fun executePendingRequests(resultCode: Int) {
    // Propagate result to pending location requests.
    for (listener in mPendingLocationRequests) {
      listener.onResult(resultCode)
    }
    mPendingLocationRequests.clear()
  }

  private fun startHeadingUpdate() {
    val locationControl = SmartLocation.with(mContext).location().oneFix().config(LocationParams.BEST_EFFORT)
    val currLoc = locationControl.lastLocation
    if (currLoc != null) {
      mGeofield = GeomagneticField(
        currLoc.latitude.toFloat(), currLoc.longitude.toFloat(), currLoc.altitude.toFloat(),
        System.currentTimeMillis()
      )
    } else {
      locationControl.start { location: Location ->
        mGeofield = GeomagneticField(
          location.latitude.toFloat(), location.longitude.toFloat(), location.altitude.toFloat(),
          System.currentTimeMillis()
        )
      }
    }
    mSensorManager.registerListener(
      this,
      mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD),
      SensorManager.SENSOR_DELAY_NORMAL
    )
    mSensorManager.registerListener(this, mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER), SensorManager.SENSOR_DELAY_NORMAL)
  }

  private fun sendUpdate() {
    val rotationMatrix = FloatArray(9)
    val inclinationMatrix = FloatArray(9)
    val success = SensorManager.getRotationMatrix(rotationMatrix, inclinationMatrix, mGravity, mGeomagnetic)
    if (success) {
      val orientation = FloatArray(3)
      SensorManager.getOrientation(rotationMatrix, orientation)

      // Make sure Delta is big enough to warrant an update
      // Currently: 50ms and ~2 degrees of change (android has a lot of useless updates block up the sending)
      if (abs(orientation[0] - mLastAzimuth) > DEGREE_DELTA && System.currentTimeMillis() - mLastUpdate > TIME_DELTA) {
        mLastAzimuth = orientation[0]
        mLastUpdate = System.currentTimeMillis()
        val magneticNorth: Float = calcMagNorth(orientation[0])
        val trueNorth: Float = calcTrueNorth(magneticNorth)

        // Write data to send back to React
        val response = HeadingEventResponse(
          watchId = mHeadingId,
          heading = Heading(
            trueHeading = trueNorth,
            magHeading = magneticNorth,
            accuracy = mAccuracy
          )
        )
        sendEvent(HEADING_EVENT_NAME, response.toBundle())
      }
    }
  }

  internal fun sendLocationResponse(watchId: Int, response: LocationResponse) {
    val responseBundle = bundleOf()
    responseBundle.putBundle("location", response.toBundle(Bundle::class.java))
    responseBundle.putInt("watchId", watchId)
    sendEvent(LOCATION_EVENT_NAME, responseBundle)
  }

  private fun calcMagNorth(azimuth: Float): Float {
    val azimuthDeg = Math.toDegrees(azimuth.toDouble()).toFloat()
    return (azimuthDeg + 360) % 360
  }

  private fun calcTrueNorth(magNorth: Float): Float {
    // Need to request geo location info to calculate true north
    val geofield = mGeofield.takeIf { !isMissingForegroundPermissions() } ?: return -1f
    return (magNorth + geofield.declination) % 360
  }

  private fun stopHeadingWatch() {
    mSensorManager.unregisterListener(this)
  }

  private fun destroyHeadingWatch() {
    stopHeadingWatch()
    mGravity = FloatArray(9)
    mGeomagnetic = FloatArray(9)
    mGeofield = null
    mHeadingId = 0
    mLastAzimuth = 0f
    mAccuracy = 0
  }

  private fun startWatching() {
    // if permissions not granted it won't work anyway, but this can be invoked when permission dialog disappears
    if (!isMissingForegroundPermissions()) {
      mGeocoderPaused = false
    }

    // Resume paused location updates
    resumeLocationUpdates()
  }

  private fun stopWatching() {
    // if permissions not granted it won't work anyway, but this can be invoked when permission dialog appears
    if (Geocoder.isPresent() && !isMissingForegroundPermissions()) {
      SmartLocation.with(mContext).geocoding().stop()
      mGeocoderPaused = true
    }
    for (requestId in mLocationCallbacks.keys) {
      pauseLocationUpdatesForRequest(requestId)
    }
  }

  private fun pauseLocationUpdatesForRequest(requestId: Int) {
    val locationCallback = mLocationCallbacks[requestId]
    if (locationCallback != null) {
      mLocationProvider.removeLocationUpdates(locationCallback)
    }
  }

  private fun removeLocationUpdatesForRequest(requestId: Int) {
    pauseLocationUpdatesForRequest(requestId)
    mLocationCallbacks.remove(requestId)
    mLocationRequests.remove(requestId)
  }

  private fun resumeLocationUpdates() {
    for (requestId in mLocationCallbacks.keys) {
      val locationCallback = mLocationCallbacks[requestId] ?: return
      val locationRequest = mLocationRequests[requestId] ?: return
      try {
        mLocationProvider.requestLocationUpdates(locationRequest, locationCallback, Looper.myLooper())
      } catch (e: SecurityException) {
        Log.e(TAG, "Error occurred while resuming location updates: $e")
      }
    }
  }

  /**
   * Gets the best most recent location found by the provider.
   */
  private suspend fun getLastKnownLocation(): Location? {
    return suspendCoroutine { continuation ->
      try {
        mLocationProvider.lastLocation
          .addOnSuccessListener { location: Location? -> continuation.resume(location) }
          .addOnCanceledListener { continuation.resume(null) }
          .addOnFailureListener { continuation.resume(null) }
      } catch (e: SecurityException) {
        continuation.resume(null)
      }
    }
  }

  private suspend fun geocode(address: String): List<GeocodeResponse> {
    if (mGeocoderPaused) {
      throw GeocodeException("Geocoder is not running")
    }

    if (isMissingForegroundPermissions()) {
      throw LocationUnauthorizedException()
    }

    if (!Geocoder.isPresent()) {
      throw NoGeocodeException()
    }

    return suspendCoroutine { continuation ->
      val locations = Geocoder(mContext, Locale.getDefault()).getFromLocationName(address, 1)
      locations?.let { location ->
        location.let {
          val results = it.mapNotNull { address ->
            val locationAddress = LocationAddress(address)
            GeocodeResponse.from(locationAddress.location)
          }
          continuation.resume(results)
        }
      } ?: continuation.resume(emptyList())
    }
  }

  private suspend fun reverseGeocode(location: ReverseGeocodeLocation): List<ReverseGeocodeResponse> {
    if (mGeocoderPaused) {
      throw GeocodeException("Geocoder is not running")
    }

    if (isMissingForegroundPermissions()) {
      throw LocationUnauthorizedException()
    }

    if (!Geocoder.isPresent()) {
      throw NoGeocodeException()
    }

    val androidLocation = Location("").apply {
      latitude = location.latitude
      longitude = location.longitude
    }

    return suspendCoroutine { continuation ->
      val locations = Geocoder(mContext, Locale.getDefault()).getFromLocation(androidLocation.latitude, androidLocation.longitude, 1)
      locations?.let { addresses ->
        val results = addresses.mapNotNull { address ->
          address?.let {
            ReverseGeocodeResponse(it)
          }
        }
        continuation.resume(results)
      } ?: continuation.resume(emptyList())
    }
  }

  //region private methods
  /**
   * Checks whether all required permissions have been granted by the user.
   */
  private fun isMissingForegroundPermissions(): Boolean {
    appContext.permissions?.let {
      val canAccessFineLocation = it.hasGrantedPermissions(Manifest.permission.ACCESS_FINE_LOCATION)
      val canAccessCoarseLocation = it.hasGrantedPermissions(Manifest.permission.ACCESS_COARSE_LOCATION)
      return !canAccessFineLocation && !canAccessCoarseLocation
    } ?: throw Exceptions.AppContextLost()
  }

  private fun hasForegroundServicePermissions(): Boolean {
    appContext.permissions?.let {
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val canAccessForegroundServiceLocation = it.hasGrantedPermissions(Manifest.permission.FOREGROUND_SERVICE_LOCATION)
        val canAccessForegroundService = it.hasGrantedPermissions(Manifest.permission.FOREGROUND_SERVICE)
        canAccessForegroundService && canAccessForegroundServiceLocation
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val canAccessForegroundService = it.hasGrantedPermissions(Manifest.permission.FOREGROUND_SERVICE)
        canAccessForegroundService
      } else {
        true
      }
    } ?: throw Exceptions.AppContextLost()
  }

  /**
   * Checks if the background location permission is granted by the user.
   */
  private fun isMissingBackgroundPermissions(): Boolean {
    appContext.permissions?.let {
      return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !it.hasGrantedPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    }
    return true
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

  private fun isBackgroundPermissionInManifest(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appContext.permissions?.let {
        return it.isPermissionPresentInManifest(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
      }
      throw NoPermissionsModuleException()
    } else {
      true
    }
  }

  /**
   * Helper method that lazy-loads the location provider for the context that the module was created.
   */

  companion object {
    internal val TAG = LocationModule::class.java.simpleName
    private const val LOCATION_EVENT_NAME = "Expo.locationChanged"
    private const val HEADING_EVENT_NAME = "Expo.headingChanged"
    private const val CHECK_SETTINGS_REQUEST_CODE = 42

    const val ACCURACY_LOWEST = 1
    const val ACCURACY_LOW = 2
    const val ACCURACY_BALANCED = 3
    const val ACCURACY_HIGH = 4
    const val ACCURACY_HIGHEST = 5
    const val ACCURACY_BEST_FOR_NAVIGATION = 6

    const val GEOFENCING_EVENT_ENTER = 1
    const val GEOFENCING_EVENT_EXIT = 2

    const val DEGREE_DELTA = 0.0355 // in radians, about 2 degrees
    const val TIME_DELTA = 50f // in milliseconds
  }

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
  }

  override fun onSensorChanged(event: SensorEvent?) {
    event ?: return
    if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
      mGravity = event.values
    } else if (event.sensor.type == Sensor.TYPE_MAGNETIC_FIELD) {
      mGeomagnetic = event.values
    }
    sendUpdate()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    mAccuracy = accuracy
  }

  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != CHECK_SETTINGS_REQUEST_CODE) {
      return
    }
    executePendingRequests(resultCode)
    mUIManager.unregisterActivityEventListener(this)
  }

  override fun onNewIntent(intent: Intent?) {}
}
