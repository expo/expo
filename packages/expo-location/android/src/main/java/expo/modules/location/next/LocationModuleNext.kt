package expo.modules.location.next

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.os.Build
import android.os.Bundle
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.LocationBackgroundUnauthorizedException
import expo.modules.location.LocationHelpers
import expo.modules.location.LocationUnauthorizedException
import expo.modules.location.NoPermissionInManifestException
import expo.modules.location.NoPermissionsModuleException
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.records.PermissionDetailsLocationAndroid
import expo.modules.location.records.PermissionRequestResponse
import java.io.Serializable
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class LocationModuleNext : Module() {
  lateinit var mContext: Context
  val fusedLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(mContext)
    val gmsLocationProvider = GmsLocationProvider(fusedLocationProvider)

    SharedRef(gmsLocationProvider)
  }
  val androidLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    SharedRef(AndroidLocationProvider(mContext))
  }
  lateinit var defaultLocationProvider: LocationProvider

  override fun definition() = ModuleDefinition {
    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      defaultLocationProvider = androidLocationProviderInstance.ref
    }

    // Permissions
    AsyncFunction("requestForegroundPermissionsAsync") Coroutine { ->
      val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()
      askForPermissionsWithPermissionsManager(
        permissionsManager,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.ACCESS_FINE_LOCATION)

      return@Coroutine getForegroundPermissionsAsync()
    }

    AsyncFunction("getForegroundPermissionsAsync") Coroutine { ->
      return@Coroutine getForegroundPermissionsAsync()
    }

    AsyncFunction("requestBackgroundPermissionsAsync") Coroutine { ->
      return@Coroutine requestBackgroundPermissionsAsync()
    }

    AsyncFunction("getBackgroundPermissionsAsync") Coroutine { ->
      return@Coroutine getBackgroundPermissionsAsync()
    }

    // Location providers
    Function("setDefaultLocationProvider") { locationProvider: SharedRef<LocationProvider> ->
      defaultLocationProvider = locationProvider.ref
    }

    Class ("LocationProvider") {
      StaticFunction("Gms") { ->
        fusedLocationProviderInstance
      }

      StaticFunction("Android") { ->
        androidLocationProviderInstance
      }
    }

    // Position
    AsyncFunction("getCurrentPositionAsync") Coroutine { ->
      ensureForegroundPermissions()
      return@Coroutine defaultLocationProvider.getCurrentPosition().unpack()
    }

    AsyncFunction("getLastKnownPositionAsync") Coroutine { ->
      ensureForegroundPermissions()
      return@Coroutine defaultLocationProvider.getLastKnownPosition()
    }

    Function("watchPosition") { ->
      ensureForegroundPermissions()
      return@Function defaultLocationProvider.watchPosition().unpack()
    }
    
    Class (LocationWatchHandle::class) {
      Events(POSITION_CHANGED)

      Function("pause") { locationWatchHandle: LocationWatchHandle ->
        locationWatchHandle.session.pause()
      }

      Function("resume") { locationWatchHandle: LocationWatchHandle ->
        locationWatchHandle.session.resume()
      }

      Function("getLastKnownPosition") { locationWatchHandle: LocationWatchHandle ->
        locationWatchHandle.session.getLastKnownPosition()
      }
    }

    // Geofencing

    // permission helpers
  }

  // We want to request the ACCESS_BACKGROUND_LOCATION permission,
  // we need to check if it is in the manifest if so we ask for it,
  // but only if we need to do it separately.
  private suspend fun requestBackgroundPermissionsAsync(): PermissionRequestResponse {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      // Before version Q, there are only foreground permissions.
      return getForegroundPermissionsAsync()
    }
    if (!isBackgroundPermissionInManifest()) {
      throw NoPermissionInManifestException("ACCESS_BACKGROUND_LOCATION")
    }
    return appContext.permissions?.let {
      askForPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    } ?: throw NoPermissionsModuleException()
  }

  private suspend fun getBackgroundPermissionsAsync(): PermissionRequestResponse {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      // Before version Q, there are only foreground permissions.
      return getForegroundPermissionsAsync()
    }
    if (!isBackgroundPermissionInManifest()) {
      throw NoPermissionInManifestException("ACCESS_BACKGROUND_LOCATION")
    }
    appContext.permissions?.let {
      return LocationHelpers.getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    } ?: throw NoPermissionsModuleException()
  }

  private fun isBackgroundPermissionInManifest(): Boolean {
    appContext.permissions?.let {
      return it.isPermissionPresentInManifest(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    }
    throw NoPermissionsModuleException()
  }

  internal suspend fun getForegroundPermissionsAsync(): PermissionRequestResponse {
    return appContext.permissions?.let {
      val coarseLocationPermission = getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_COARSE_LOCATION)
      val fineLocationPermission = getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_FINE_LOCATION)

      var locationPermission = coarseLocationPermission
      var accuracy = "none"
      if (coarseLocationPermission.granted) {
        accuracy = "coarse"
      }
      if (fineLocationPermission.granted) {
        locationPermission = fineLocationPermission
        accuracy = "fine"
      }
      locationPermission.android = PermissionDetailsLocationAndroid(accuracy)

      locationPermission
    } ?: throw NoPermissionsModuleException()
  }

  private fun ensureForegroundPermissions() {
    val permissions = appContext.permissions ?: throw NoPermissionsModuleException()
    val hasFine = permissions.hasGrantedPermissions(Manifest.permission.ACCESS_FINE_LOCATION)
    val hasCoarse = permissions.hasGrantedPermissions(Manifest.permission.ACCESS_COARSE_LOCATION)
    if (!hasFine && !hasCoarse) {
      throw LocationUnauthorizedException()
    }
  }

  private fun ensureBackgroundPermissions() {
    ensureForegroundPermissions()
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      // Before version Q there were no separate background permissions.
      return
    }
    val permissions = appContext.permissions ?: throw NoPermissionsModuleException()
    if (!permissions.hasGrantedPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION)) {
      throw LocationBackgroundUnauthorizedException()
    }
  }
}


/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// STRUCTS ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

@OptimizedRecord
class Coordinates (
  @Field val latitude: Double,
  @Field val longitude: Double,
): Record, Serializable


@OptimizedRecord
class Position (
  @Field val coordinates: Coordinates,

  @Field val mslAltitude: Double? = null,
  @Field val ellipsoidalAltitude: Double? = null,
  @Field val speed: Double? = null,

  @Field val horizontalAccuracy: Double? = null,
  @Field val verticalAccuracy: Double? = null,
  @Field val speedAccuracy: Double? = null,
): Record, Serializable

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Permissions helpers ///////////////////////////
/////////////////////////////////////////////////////////////////////////////////

internal class PermissionsPromise(private val continuation: Continuation<PermissionRequestResponse>): Promise {
  override fun resolve(value: Any?) {
    val result = value as? Bundle
      ?: throw ConversionException(Any::class.java, Bundle::class.java, "value to which permission promise resolved is not a bundle")

    continuation.resume(PermissionRequestResponse(result))
  }

  override fun reject(code: String?, message: String?, cause: Throwable?) {
    continuation.resumeWithException(CodedException(code, message, cause))
  }
}

internal suspend fun askForPermissionsWithPermissionsManager(permissionsManager: Permissions, vararg permissionStrings: String): PermissionRequestResponse {
  return suspendCoroutine { continuation ->
    Permissions.askForPermissionsWithPermissionsManager(
      permissionsManager,
      PermissionsPromise(continuation),
      *permissionStrings
    )
  }
}

internal suspend fun getPermissionsWithPermissionsManager(permissionManager: Permissions, vararg permissionStrings: String): PermissionRequestResponse {
  return suspendCoroutine { continuation ->
    Permissions.getPermissionsWithPermissionsManager(
      permissionManager,
      PermissionsPromise(continuation),
      *permissionStrings
    )
  }
}

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// SHARED OBJECTS ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

interface PositionWatchSession {
  fun pause()
  fun resume()
  fun start(onPosition: (Position) -> Unit)
  fun stop()
  fun release()
  fun getLastKnownPosition(): Position?
}

interface WatchSession {
  fun startUpdates()
  fun stopUpdates()
}

class PausableWatchSession(
  val sessionImpl: (onPosition: (Position) -> Unit) -> WatchSession
): PositionWatchSession {
  var lastPosition: Position? = null
  var isPaused: Boolean = false
  var isStarted: Boolean = false
  var isReleased: Boolean = false
  var isSubscribed: Boolean = false
  var session: WatchSession? = null

  @SuppressLint("MissingPermission")
  private fun handleLocationUpdatesRequest() {
    val shouldRequestUpdates = !isPaused && isStarted && !isReleased && !isSubscribed
    val shouldRemoveRequest = (isPaused || !isStarted || isReleased) && isSubscribed
    if (session == null) {
      return
    }
    if (shouldRequestUpdates) {
      session?.startUpdates()
      isSubscribed = true
    }
    if (shouldRemoveRequest) {
      session?.stopUpdates()
      isSubscribed = false
    }
  }

  override fun start(onPosition: (Position) -> Unit) {
    isStarted = true
    this.session = sessionImpl{ pos ->
      lastPosition = pos
      onPosition(pos)
    }
    handleLocationUpdatesRequest()
  }

  override fun stop() {
    isStarted = false
    handleLocationUpdatesRequest()
  }

  override fun pause() {
    isPaused = true
    handleLocationUpdatesRequest()
  }

  override fun resume() {
    isPaused = false
    handleLocationUpdatesRequest()
  }

  override fun release() {
    isReleased = true
    handleLocationUpdatesRequest()
  }

  override fun getLastKnownPosition(): Position? {
    return lastPosition
  }
}

class LocationWatchHandle(val session: PositionWatchSession): SharedObject() {
  override fun onStartListeningToEvent(eventName: String) {
    if (eventName == POSITION_CHANGED) {
      session.start { position -> emit(POSITION_CHANGED, position)}
    }
  }

  override fun onStopListeningToEvent(eventName: String) {
    if (eventName == POSITION_CHANGED) {
      session.stop()
    }
  }

  override fun sharedObjectDidRelease() {
    session.release()
  }
}

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// LocationProvider //////////////////////////////
/////////////////////////////////////////////////////////////////////////////////


sealed interface ProviderOutcome<out T> {
  data class Success<T>(val value: T): ProviderOutcome<T>
  object Unavailable: ProviderOutcome<Nothing>
  object Unsupported: ProviderOutcome<Nothing>

  fun unpack(): T = when (this) {
    is Success -> value
    Unavailable -> throw LocationUnavailableException()
    Unsupported -> throw LocationOperationNotSupportedException()
  }
}


interface LocationProvider {
  suspend fun getCurrentPosition(): ProviderOutcome<Position>
  fun watchPosition(): ProviderOutcome<LocationWatchHandle>
  suspend fun getLastKnownPosition(): Position?
}

class LocationUnavailableException: CodedException("Location fix is currently unavailable")
class LocationOperationNotSupportedException: CodedException("This location operation is not supported")

internal class ConversionException(fromClass: Class<*>, toClass: Class<*>, message: String? = "") :
  CodedException("Couldn't cast from ${fromClass::class.simpleName} to ${toClass::class.java.simpleName}: $message")

fun Location.mslAltitude(): Double? {
  return if (Build.VERSION.SDK_INT >= 34 && hasMslAltitude()) {
    mslAltitudeMeters
  } else null
}

fun Location.verticalAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasVerticalAccuracy()) {
    verticalAccuracyMeters.toDouble()
  } else null
}

fun Location.speedAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasSpeedAccuracy()) {
    speedAccuracyMetersPerSecond.toDouble()
  } else null
}

fun Location.toPosition(): Position {
  return Position(
    coordinates = Coordinates(
      latitude,
      longitude
    ),
    mslAltitude = mslAltitude(),
    ellipsoidalAltitude = if (hasAltitude()) altitude else null,
    speed= if (hasSpeed()) speed.toDouble() else null,

    horizontalAccuracy = if (this.hasAccuracy()) this.accuracy.toDouble() else null,
    verticalAccuracy = verticalAccuracy(),
    speedAccuracy = speedAccuracy(),
  )
}
