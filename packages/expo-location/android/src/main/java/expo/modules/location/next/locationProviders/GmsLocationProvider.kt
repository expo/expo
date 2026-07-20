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
import expo.modules.location.next.LocationEvents
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
  var onPosition: (Position) -> Unit = { pos: Position ->
    Log.d("LOC", "On position default function")
  }
  var currentlyListening: Boolean = false

  override fun onLocationResult(result: LocationResult) {
    result.lastLocation?.let{
      onPosition(it.toPosition())
    }
  }

  @SuppressLint("MissingPermission")
  override fun start(onPosition: (Position) -> Unit) {
    this.onPosition = onPosition
    val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 200L).setMinUpdateDistanceMeters(0f).build()
    val locationUpdatesRequest = gmsLocationProvider.fusedLocationProvider.requestLocationUpdates(
      request,
      this,
      Looper.getMainLooper()
    )
    currentlyListening = true
  }

  override fun pause() {
    if (!currentlyListening) {
      return
    }
    currentlyListening = false
    gmsLocationProvider.fusedLocationProvider.removeLocationUpdates(this)
  }

  @SuppressLint("MissingPermission")
  override fun resume() {
    if (currentlyListening) {
      return;
    }
    val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 200L).setMinUpdateDistanceMeters(0f).build()
    gmsLocationProvider.fusedLocationProvider.requestLocationUpdates(
      request,
      this,
      Looper.getMainLooper()
    )
  }

  override fun stop() {
    // TODO(@HubertBer) Maybe we can remove the callback altogether.
    if (currentlyListening) {
      gmsLocationProvider.fusedLocationProvider.removeLocationUpdates(this)
    }
    currentlyListening = false
  }

  override fun getLastPosition(): Position {
//    gmsLocationProvider.fusedLocationProvider.lastLocation()
    TODO("Not yet implemented")
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

  override fun watchPositionAsync(): LocationWatchHandle {
    // TODO(@HubertBer) add configuration options
    val watchSession = GmsWatchSession(this)
    val locationWatchHandle = LocationWatchHandle(watchSession)
    watchSession.start { position ->
      // TODO(@HubertBer) Check what's the difference between emiting event from a SharedObject and a Module
      locationWatchHandle.emit(LocationEvents.POSITION_EVENT_NAME, position)
    }
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
