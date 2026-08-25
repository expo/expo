package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import android.os.Looper
import android.provider.Settings
import androidx.core.location.LocationListenerCompat
import expo.modules.location.next.LocationProvider
import expo.modules.location.next.PositionWatchHandle
import expo.modules.location.next.PausableWatchSession
import expo.modules.location.next.Position
import expo.modules.location.next.ProviderResult
import expo.modules.location.next.WatchSession
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

public const val SETTINGS_REQUEST_CODE = 1492
class AndroidLocationProvider(private val context: Context): LocationProvider {
  val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

  override fun name(): String {
    return "Android"
  }

  @SuppressLint("MissingPermission")
  override suspend fun getCurrentPosition(): ProviderResult<Position> {
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
      return ProviderResult.Unavailable
    }
    return ProviderResult.Success(locationResult.toPosition())
  }


  override fun watchPosition(): ProviderResult<PositionWatchHandle> {
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
    val locationWatchHandle = PositionWatchHandle(watchSession)
    return ProviderResult.Success(locationWatchHandle)
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

  // On plain android we can only move user to settings.
  override suspend fun enableLocationServices(activity: Activity, storeContinuationObject: (Continuation<Boolean>) -> Unit): ProviderResult<Boolean> {
    val enabled = suspendCoroutine { continuation ->
      storeContinuationObject(continuation)
      try {
        activity.startActivityForResult(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS), SETTINGS_REQUEST_CODE)
      } catch (e: Throwable) {
        continuation.resume(false)
      }
    }
    return ProviderResult.Success(enabled)
  }
}
