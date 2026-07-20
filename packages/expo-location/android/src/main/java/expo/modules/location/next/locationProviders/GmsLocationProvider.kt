package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.location.Location
import android.os.Looper
import android.util.Log
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import expo.modules.location.next.LocationProvider
import expo.modules.location.next.LocationUnavailableException
import expo.modules.location.next.LocationWatchHandle
import expo.modules.location.next.PositionWatchSession
import expo.modules.location.next.Position
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class GmsWatchSession(val gmsLocationProvider: GmsLocationProvider): PositionWatchSession, LocationCallback() {
  val request = LocationRequest
    .Builder(Priority.PRIORITY_HIGH_ACCURACY, 200L)
    .setMinUpdateDistanceMeters(0f)
    .build()

  var lastPosition: Position? = null
  var onPosition: (Position) -> Unit = { pos: Position ->
    Log.d("LOC", "On position default function")
  }
  var isPaused: Boolean = false
  var isStarted: Boolean = false
  var isReleased: Boolean = false
  var isSubscribed: Boolean = false

  override fun onLocationResult(result: LocationResult) {
    result.lastLocation?.let{
      val positionNow = it.toPosition()
      lastPosition = positionNow
      onPosition(positionNow)
    }
  }

  @SuppressLint("MissingPermission")
  private fun handleLocationUpdatesRequest() {
    val shouldRequestUpdates = !isPaused && isStarted && !isReleased && !isSubscribed
    val shouldRemoveRequest = (isPaused || !isStarted || isReleased) && isSubscribed
    if (shouldRequestUpdates) {
      gmsLocationProvider.fusedLocationProvider.requestLocationUpdates(
        request,
        this,
        Looper.getMainLooper()
      )
      isSubscribed = true
    }
    if (shouldRemoveRequest) {
      gmsLocationProvider.fusedLocationProvider.removeLocationUpdates(this)
      isSubscribed = false
    }
  }

  override fun start(onPosition: (Position) -> Unit) {
    isStarted = true
    this.onPosition = onPosition
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

  override fun getLastPosition(): Position? {
    return lastPosition
  }
}

class GmsLocationProvider(
  val fusedLocationProvider: FusedLocationProviderClient
): LocationProvider {
  @SuppressLint("MissingPermission")
  override suspend fun getCurrentPosition(): Position {
    val cts = CancellationTokenSource()
    val location: Location? = suspendCancellableCoroutine { continuation ->
      // TODO(@HubertBer) add option to select Priority
      fusedLocationProvider
        .getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cts.token)
        .addOnSuccessListener { location ->
          continuation.resume(location)
        }.addOnFailureListener { e -> continuation.resumeWithException(e) }
        .addOnCanceledListener { continuation.cancel() }
    }
    if (location == null) {
      throw LocationUnavailableException()
    }
    return location.toPosition()
  }

  override fun watchPosition(): LocationWatchHandle {
    // TODO(@HubertBer) add configuration options
    val watchSession = GmsWatchSession(this)
    val locationWatchHandle = LocationWatchHandle(watchSession)
    return locationWatchHandle
  }

  @SuppressLint("MissingPermission")
  override suspend fun getLastKnownPosition(): Position? {
    val location: Location? = suspendCancellableCoroutine { continuation ->
      try {
        fusedLocationProvider
          .lastLocation
          .addOnSuccessListener { location -> continuation.resume(location) }
          .addOnFailureListener { e -> continuation.resume(null) }
          .addOnCanceledListener { continuation.resume(null) }
      } catch (e: SecurityException) {
        continuation.resume(null)
      }
    }
    return location?.toPosition()
  }
}
