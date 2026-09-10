package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.app.Activity
import android.location.Location
import android.os.Looper
import android.util.Log
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationSettingsRequest
import com.google.android.gms.location.Priority
import com.google.android.gms.location.SettingsClient
import com.google.android.gms.tasks.Task
import expo.modules.location.next.Position
import expo.modules.location.next.SETTINGS_REQUEST_CODE
import expo.modules.location.next.toPosition
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.time.Duration

fun LocationPriority.toGmsPriority(): Int {
  return when (this) {
    LocationPriority.HIGH_ACCURACY -> Priority.PRIORITY_HIGH_ACCURACY
    LocationPriority.BALANCED_POWER_ACCURACY -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
    LocationPriority.LOW_POWER -> Priority.PRIORITY_LOW_POWER
    LocationPriority.PASSIVE -> Priority.PRIORITY_PASSIVE
  }
}

private suspend fun <T> Task<T>.awaitOrNull(): T? {
  return suspendCancellableCoroutine { continuation ->
    this.addOnSuccessListener { continuation.resume(it) }
    this.addOnFailureListener { e ->
      Log.w("ExpoLocation", "GMS location task failed", e)
      continuation.resume(null)
    }
    this.addOnCanceledListener { continuation.resume(null) }
  }
}

class GmsLocationProvider(
  val fusedLocationProvider: FusedLocationProviderClient,
  val settingsClient: SettingsClient,
  val isServiceAvailable: () -> Boolean
) : LocationProvider {
  override val name = "GMS"

  @SuppressLint("MissingPermission")
  private suspend fun getCurrentLocation(options: GetCurrentPositionOptions): Location? {
    val request = CurrentLocationRequest
      .Builder()
      .setPriority(options.priority.toGmsPriority())
      .setDurationMillis(options.timeout.inWholeMilliseconds)
      .setMaxUpdateAgeMillis(options.maxCachedAge.inWholeMilliseconds)
      .build()
    return fusedLocationProvider.getCurrentLocation(request, null).awaitOrNull()
  }

  @SuppressLint("MissingPermission")
  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    if (!isServiceAvailable()) {
      return ProviderResult.Unsupported
    }

    val currentLocation: Location? = if (options.timeout > Duration.ZERO) {
      getCurrentLocation(options)
    } else {
      null
    }

    val resultLocation = currentLocation ?: fusedLocationProvider.lastLocation.awaitOrNull()

    return resultLocation?.let {
      ProviderResult.Success(it.toPosition())
    } ?: ProviderResult.Unavailable
  }

  override fun watchPosition(): ProviderResult<WatchSession> {
    if (!isServiceAvailable()) return ProviderResult.Unsupported
    return ProviderResult.Success(GmsWatchSession(fusedLocationProvider))
  }

  override suspend fun enableLocationServices(activity: Activity): ProviderResult<EnableLocationServicesResult> {
    if (!isServiceAvailable()) {
      return ProviderResult.Unsupported
    }
    val settingsRequest = LocationSettingsRequest
      .Builder()
      .addLocationRequest(LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 1000L).build())
      .setAlwaysShow(true)
      .build()

    try {
      val enableServicesResult = suspendCancellableCoroutine { continuation ->
        settingsClient.checkLocationSettings(settingsRequest)
          .addOnSuccessListener { continuation.resume(EnableLocationServicesResult.Enabled) }
          .addOnFailureListener { continuation.resumeWithException(it) }
          .addOnCanceledListener { continuation.cancel() }
      }
      return ProviderResult.Success(enableServicesResult)
    } catch (resolvable: ResolvableApiException) {
      val enableServicesResult = runCatching {
        resolvable.startResolutionForResult(activity, SETTINGS_REQUEST_CODE)
      }.fold(
        onSuccess = { EnableLocationServicesResult.ResolutionPending },
        onFailure = { EnableLocationServicesResult.Disabled }
      )
      return ProviderResult.Success(enableServicesResult)
    } catch (e: CancellationException) {
      throw e
    } catch (_: Throwable) {
      return ProviderResult.Unavailable
    }
  }
}

private class GmsWatchSession(
  private val fusedLocationProvider: FusedLocationProviderClient
) : WatchSession {
  private var callback: LocationCallback? = null

  @SuppressLint("MissingPermission")
  override fun startUpdates(parameters: WatchPositionParameters, onPosition: (Position) -> Unit): Boolean {
    stopUpdates()
    val locationRequest = LocationRequest
      .Builder(parameters.priority.toGmsPriority(), parameters.interval.inWholeMilliseconds)
      .setMaxUpdateDelayMillis(parameters.maxUpdateDelay.inWholeMilliseconds)
      .build()
    val callback = object: LocationCallback() {
      override fun onLocationResult(locationResult: LocationResult) {
        locationResult.lastLocation?.let {
          onPosition(it.toPosition())
        }
      }
    }
    this.callback = callback
    fusedLocationProvider.requestLocationUpdates(locationRequest, callback, Looper.getMainLooper())
    return true
  }

  override fun stopUpdates() {
    callback?.let { fusedLocationProvider.removeLocationUpdates(it) }
    callback = null
  }
}
