package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.location.LocationRequest
import android.os.Build
import android.os.CancellationSignal
import android.os.Looper
import androidx.core.location.LocationListenerCompat
import expo.modules.location.next.LocationProvider
import expo.modules.location.next.LocationWatchHandle
import expo.modules.location.next.PausableWatchSession
import expo.modules.location.next.Position
import expo.modules.location.next.PositionWatchSession
import expo.modules.location.next.ProviderOutcome
import expo.modules.location.next.WatchSession
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

class AndroidLocationProvider(private val context: Context): LocationProvider {
  val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

  @SuppressLint("MissingPermission")
  override suspend fun getCurrentPosition(): ProviderOutcome<Position> {
    // TODO(@HubertBer) Add options
    val provider = LocationManager.GPS_PROVIDER
    val locationResult: Location? =
      withTimeoutOrNull(
      90_000L,
      ){
        suspendCancellableCoroutine { continuation ->
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

        val listener = object: LocationListenerCompat {
          override fun onLocationChanged(location: Location) {
            locationManager.removeUpdates(this)
            continuation.resume(location)
          }
        }

        // TODO(@HubertBer) add the options in here
        locationManager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
        continuation.invokeOnCancellation {
          locationManager.removeUpdates(listener)
        }
      }
    }

    if (locationResult == null) {
      return ProviderOutcome.Unavailable
    }
    return ProviderOutcome.Success(locationResult.toPosition())
  }


  override fun watchPosition(): ProviderOutcome<LocationWatchHandle> {
    val watchSession = PausableWatchSession { onPosition: (Position) -> Unit ->
      val provider = LocationManager.GPS_PROVIDER
      return@PausableWatchSession object: WatchSession, LocationListenerCompat {
        @SuppressLint("MissingPermission")
        override fun startUpdates() {
          locationManager.requestLocationUpdates(provider, 1000L, 0f, this, Looper.getMainLooper())
        }

        override fun stopUpdates() {
          locationManager.removeUpdates(this)
        }

        override fun onLocationChanged(location: Location) {
          onPosition(location.toPosition())
        }
      }
    }
    val locationWatchHandle = LocationWatchHandle(watchSession)
    return ProviderOutcome.Success(locationWatchHandle)
  }

  override suspend fun getLastKnownPosition(): Position? {
    return locationManager.getProviders(true).mapNotNull {
      try {
        locationManager.getLastKnownLocation(it)
      } catch (e: SecurityException) {
        null
      }
    }.maxByOrNull { it.time }?.toPosition()
  }
}

//class AndroidWatchSession(androidlocationProvider: AndroidLocationProvider): PositionWatchSession {
//  override fun pause() {
//    TODO("Not yet implemented")
//  }
//
//  override fun resume() {
//    TODO("Not yet implemented")
//  }
//
//  override fun start(onPosition: (Position) -> Unit) {
//    TODO("Not yet implemented")
//  }
//
//  override fun stop() {
//    TODO("Not yet implemented")
//  }
//
//  override fun release() {
//    TODO("Not yet implemented")
//  }
//
//  override fun getLastKnownPosition(): Position? {
//    TODO("Not yet implemented")
//  }
//
//}