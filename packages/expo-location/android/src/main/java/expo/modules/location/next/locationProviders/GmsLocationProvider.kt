package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.app.Activity
import android.location.Location
import android.os.Looper
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationSettingsRequest
import com.google.android.gms.location.Priority
import com.google.android.gms.location.SettingsClient
import com.google.android.gms.tasks.CancellationTokenSource
import expo.modules.location.next.GetCurrentPositionOptions
import expo.modules.location.next.LocationPriority
import expo.modules.location.next.LocationProvider
import expo.modules.location.next.Position
import expo.modules.location.next.ProviderResult
import expo.modules.location.next.WatchPositionParameters
import expo.modules.location.next.WatchSession
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

fun LocationPriority.toGmsPriority(): Int {
  return when (this) {
    LocationPriority.HIGH_ACCURACY -> Priority.PRIORITY_HIGH_ACCURACY
    LocationPriority.BALANCED_POWER_ACCURACY -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
    LocationPriority.LOW_POWER -> Priority.PRIORITY_LOW_POWER
    LocationPriority.PASSIVE -> Priority.PRIORITY_PASSIVE
  }
}

class GmsLocationProvider(
  val fusedLocationProvider: FusedLocationProviderClient,
  val settingsClient: SettingsClient,
  val isServiceAvailable: () -> Boolean,
): LocationProvider, LocationCallback() {
  override fun name(): String {
    return "GMS"
  }

  @SuppressLint("MissingPermission")
  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    if (!isServiceAvailable()) return ProviderResult.Unsupported;
    val cts = CancellationTokenSource()

    val request = CurrentLocationRequest.Builder()
      .setPriority(options.priority.toGmsPriority())
      .setDurationMillis(options.timeout.inWholeMilliseconds)
      .setMaxUpdateAgeMillis(options.maxCachedAge.inWholeMilliseconds)
      .build()
    val location: Location? = suspendCancellableCoroutine { continuation ->
      fusedLocationProvider
        .getCurrentLocation(request, cts.token)
        .addOnSuccessListener { location ->
          continuation.resume(location)
        }.addOnFailureListener { e -> continuation.resumeWithException(e) }
        .addOnCanceledListener { continuation.cancel() }
    }
    if (location == null) {
      return ProviderResult.Unavailable
    }
    return ProviderResult.Success(location.toPosition())
  }

  override fun watchPosition(): ProviderResult<WatchSession> {
    if (!isServiceAvailable()) return ProviderResult.Unsupported;
    return ProviderResult.Success(GmsWatchSession(fusedLocationProvider))
  }

  override suspend fun enableLocationServices(activity: Activity, storeContinuationObject: (Continuation<Boolean>) -> Unit): ProviderResult<Boolean> {
    if (!isServiceAvailable()) return ProviderResult.Unsupported;
    val settingsRequest = LocationSettingsRequest
      .Builder()
      .addLocationRequest(LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 1000L).build())
      .build()

    val resolvable: ResolvableApiException? = try {
      suspendCancellableCoroutine { continuation ->
        settingsClient.checkLocationSettings(settingsRequest)
          .addOnSuccessListener { continuation.resume(null) }
          .addOnFailureListener { e ->
            if (e is ResolvableApiException) continuation.resume(e) else continuation.resumeWithException(e)
          }
          .addOnCanceledListener { continuation.cancel() }
      }
    } catch (e: ApiException) {
      return ProviderResult.Unavailable
    }
    if (resolvable == null) {
      return ProviderResult.Success(true)
    }
    val enabled = suspendCoroutine { continuation ->
      storeContinuationObject(continuation)
      try {
        activity.startIntentSenderForResult(
          resolvable.resolution.intentSender,
          SETTINGS_REQUEST_CODE,
          null, 0, 0, 0
        )
      } catch (e: Throwable) {
        continuation.resume(false)
      }
    }
    return ProviderResult.Success(enabled)
  }
}

private class GmsWatchSession(
  private val fusedLocationProvider: FusedLocationProviderClient
): WatchSession {
  private var callback: LocationCallback? = null

  @SuppressLint("MissingPermission")
  override fun startUpdates(parameters: WatchPositionParameters, onPosition: (Position) -> Unit) {
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
  }

  override fun stopUpdates() {
    callback?.let { fusedLocationProvider.removeLocationUpdates(it) }
    callback = null
  }
}
