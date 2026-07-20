package expo.modules.location.next

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Looper
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
import expo.modules.location.NoPermissionsModuleException
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.records.PermissionDetailsLocationAndroid
import expo.modules.location.records.PermissionRequestResponse
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.Serializable
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class LocationModule : Module() {
  var defaultLocationProvider: LocationProvider
  val fusedLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(mContext)
    val gmsLocationProvider = GmsLocationProvider(fusedLocationProvider)
    SharedRef(gmsLocationProvider)
  }
  val androidLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    SharedRef(AndroidLocationProvider())
  }
  lateinit var mContext: Context

  init {
    defaultLocationProvider = androidLocationProviderInstance.ref
  }

  override fun definition() = ModuleDefinition {
    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
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
      val pos = Position(coordinates = Coordinates(0.0, 0.0))
      return@Coroutine pos
    }

    Class (LocationWatchHandle::class) {
      AsyncFunction("pause") { locationWatchHandle: LocationWatchHandle ->
        locationWatchHandle.session.pause()
      }
      AsyncFunction("resume") { locationWatchHandle: LocationWatchHandle ->
        locationWatchHandle.session.resume()
      }
      AsyncFunction("stop") { locationWatchHandle: LocationWatchHandle ->
        locationWatchHandle.session.stop()
      }
      Function("getLastPosition") { locationWatchHandle: LocationWatchHandle ->
        locationWatchHandle.session.getLastPosition()
      }
    }

    // Geofencing

    // permission helpers
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

class LocationEvents {
  companion object {
    const val POSITION_EVENT_NAME = "EXPO_LOCATION_POSITION_CHANGED"
  }
}

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// SHARED OBJECTS ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

interface PositionWatchSession {
  fun pause()
  fun resume()
  fun stop()
  fun getLastPosition(): Position

  fun start(onPosition: (Position) -> Unit)
}

class LocationWatchHandle(val session: PositionWatchSession): SharedObject() {}

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// LocationProvider //////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

interface LocationProvider {
  suspend fun getCurrentPosition(): Position
  fun watchPositionAsync(): LocationWatchHandle
}

class LocationUnavailableException: Exception()
internal class MethodNotImplementedException: Exception()
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

class AndroidLocationProvider: LocationProvider {
  lateinit var context: Context

  @SuppressLint("MissingPermission")
  override suspend fun getCurrentPosition(): Position {
    // TODO(@HubertBer) Add options, handle the other older android API versions
    val provider = LocationManager.GPS_PROVIDER
    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val location: Location = suspendCancellableCoroutine { continuation ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val signal = CancellationSignal()
        continuation.invokeOnCancellation { signal.cancel() }
        return@suspendCancellableCoroutine locationManager.getCurrentLocation(
          provider,
          signal,
          context.mainExecutor
        ) { location ->
          continuation.resume(location)
        }
      }

      val listener = LocationListener { TODO("Not yet implemented") }
      locationManager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
      continuation.invokeOnCancellation { locationManager.removeUpdates(listener) }
    }
    return location.toPosition()
  }


  override fun watchPositionAsync(): LocationWatchHandle {
    TODO("")
//    Log.d("LOC", "Watch position async")
  }
}


class FallbackLocationProvider(val locationProviders: List<LocationProvider>): LocationProvider {
  override suspend fun getCurrentPosition(): Position {
    for (locationProvider in locationProviders) {
      val position = locationProvider.getCurrentPosition()
      return position
    }

    throw MethodNotImplementedException()
  }

  override fun watchPositionAsync(): LocationWatchHandle {
    TODO("Not yet implemented")
  }
}
