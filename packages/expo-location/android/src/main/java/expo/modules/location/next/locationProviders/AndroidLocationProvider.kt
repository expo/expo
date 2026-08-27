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
import expo.modules.location.next.GetCurrentPositionOptions
import expo.modules.location.next.LocationPriority
import expo.modules.location.next.LocationProvider
import expo.modules.location.next.Position
import expo.modules.location.next.ProviderResult
import expo.modules.location.next.WatchPositionParameters
import expo.modules.location.next.WatchSession
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

fun LocationPriority.toProvider(): String {
  return when (this) {
    LocationPriority.HIGH_ACCURACY, LocationPriority.BALANCED_POWER_ACCURACY -> {
      if (Build.VERSION.SDK_INT >= 31) {
        LocationManager.FUSED_PROVIDER
      } else LocationManager.GPS_PROVIDER
    }
    LocationPriority.LOW_POWER -> LocationManager.NETWORK_PROVIDER
    LocationPriority.PASSIVE -> LocationManager.PASSIVE_PROVIDER
  }
}

public const val SETTINGS_REQUEST_CODE = 1492
class AndroidLocationProvider(private val context: Context): LocationProvider {
  val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

  override fun name(): String {
    return "Android"
  }

  @SuppressLint("MissingPermission")
  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    val provider = options.priority.toProvider()
    val locationResult: Location? =
      withTimeoutOrNull(options.timeout) {
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


  override fun watchPosition(): ProviderResult<WatchSession> {
    return ProviderResult.Success(AndroidWatchSession(locationManager))
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

private class AndroidWatchSession(
  private val locationManager: LocationManager
): WatchSession {
  private var listener: LocationListenerCompat? = null

  @SuppressLint("MissingPermission")
  override fun startUpdates(parameters: WatchPositionParameters, onPosition: (Position) -> Unit) {
    val listener = object: LocationListenerCompat {
      override fun onLocationChanged(location: Location) {
        onPosition(location.toPosition())
      }
    }
    this.listener = listener
    locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, parameters.interval.inWholeMilliseconds, 0f, listener, Looper.getMainLooper())
  }

  override fun stopUpdates() {
    listener?.let { locationManager.removeUpdates(it) }
    listener = null
  }
}
