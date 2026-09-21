package expo.modules.location.next.locationProviders

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import android.os.SystemClock
import android.provider.Settings
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import expo.modules.location.next.Position
import expo.modules.location.next.SETTINGS_REQUEST_CODE
import expo.modules.location.next.toPosition
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume
import kotlin.time.Duration

fun resolveLocationProvider(locationPriority: LocationPriority, context: Context, locationManager: LocationManager): String? {
  // Pick the desired provider based on LocationPriority options
  val desiredProvider = when (locationPriority) {
    LocationPriority.HIGH_ACCURACY, LocationPriority.BALANCED_POWER_ACCURACY -> {
      if (Build.VERSION.SDK_INT >= 31) {
        LocationManager.FUSED_PROVIDER
      } else {
        LocationManager.GPS_PROVIDER
      }
    }
    LocationPriority.LOW_POWER -> LocationManager.NETWORK_PROVIDER
    LocationPriority.PASSIVE -> LocationManager.PASSIVE_PROVIDER
  }

  // Avoid GPS_PROVIDER, when only coarse permissions are given.
  val fineGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
  val enabledProviders = locationManager.getProviders(true)
  val validProviders = enabledProviders.filter {
    it != LocationManager.GPS_PROVIDER || fineGranted
  }

  // Downgrade provider if it is not valid.
  var provider : String? = desiredProvider
  while (provider != null && provider !in validProviders) {
    provider = when (provider) {
      LocationManager.FUSED_PROVIDER -> LocationManager.GPS_PROVIDER
      LocationManager.GPS_PROVIDER -> LocationManager.NETWORK_PROVIDER
      LocationManager.NETWORK_PROVIDER -> LocationManager.PASSIVE_PROVIDER
      else -> null
    }
  }

  return provider
}

class AndroidLocationProvider(private val context: Context) : LocationProvider {
  val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

  override fun name(): String {
    return "Android"
  }

  @SuppressLint("MissingPermission")
  private fun getLastKnownLocation(): Location? {
    val fineGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
    val enabledProviders = locationManager.getProviders(true)
    return enabledProviders
      .mapNotNull {
        if (it == LocationManager.GPS_PROVIDER && !fineGranted) {
          null
        } else {
          locationManager.getLastKnownLocation(it)
        }
      }
      .maxByOrNull { it.elapsedRealtimeNanos }
  }

  @SuppressLint("MissingPermission")
  private suspend fun getCurrentLocationWithTimeout(provider: String, timeout: Duration): Location? {
    return withTimeoutOrNull(timeout) {
      suspendCancellableCoroutine { continuation ->
        val signal = CancellationSignal()
        continuation.invokeOnCancellation { signal.cancel() }
        LocationManagerCompat.getCurrentLocation(locationManager, provider, signal, ContextCompat.getMainExecutor(context)) {
          continuation.resume(it)
        }
      }
    }
  }

  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    val lastLocation = getLastKnownLocation()
    val lastPositionResult = lastLocation
      ?.let { ProviderResult.Success(it.toPosition()) }
      ?: ProviderResult.Unavailable
    val validCachedResult = lastLocation !== null && SystemClock.elapsedRealtimeNanos() - lastLocation.elapsedRealtimeNanos < options.maxCachedAge.inWholeNanoseconds
    if (validCachedResult || options.timeout == Duration.ZERO) {
      return lastPositionResult
    }

    val provider = resolveLocationProvider(options.priority, context, locationManager) ?: return lastPositionResult
    val currentLocation = getCurrentLocationWithTimeout(provider, options.timeout)
    val currentPosition = currentLocation?.toPosition() ?: return lastPositionResult
    return ProviderResult.Success(currentPosition)
  }

  // On plain android we can only move user to settings.
  override suspend fun enableLocationServices(activity: Activity, promptResult: CompletableDeferred<Boolean>): ProviderResult<Unit> {
    try {
      activity.startActivityForResult(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS), SETTINGS_REQUEST_CODE)
    } catch (e: Throwable) {
      promptResult.complete(false)
    }
    return ProviderResult.Success(Unit)
  }
}
