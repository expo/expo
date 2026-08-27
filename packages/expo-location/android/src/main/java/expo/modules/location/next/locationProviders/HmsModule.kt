package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.location.Location
import android.os.Looper
import com.huawei.hms.location.LocationServices
import com.huawei.hms.location.FusedLocationProviderClient
import com.huawei.hms.location.LocationCallback
import com.huawei.hms.location.LocationRequest
import com.huawei.hms.location.LocationResult
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedRef
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

// Location provider backed by Huawei Mobile Services (HMS) Location Kit. HMS mirrors the
// pre-Builder GMS API almost 1:1 (LocationRequest.create(), Task-based FusedLocationProviderClient),
// so this implementation follows GmsLocationProvider closely.
//
// NOTE(module API): this file does not compile or run on its own - the following changes are
// needed outside of it:
// 1. build.gradle: add `implementation "com.huawei.hms:location:<version>"` AND the Huawei maven
//    repository (`https://developer.huawei.com/repo/`) - check whether the repo-wide gradle
//    config accepts extra repositories for a single package before committing to this track.
// 2. LocationModuleNext: a lazy `huaweiLocationProviderInstance` (needs `mContext` to create the
//    HMS client via com.huawei.hms.location.LocationServices.getFusedLocationProviderClient) and
//    a `StaticFunction("Huawei")` inside Class("LocationProvider").
// 3. Availability: on devices without HMS Core every call fails at runtime. Consider gating the
//    static (or the provider construction) with
//    HuaweiApiAvailability.getInstance().isHuaweiMobileServicesAvailable(context) == ConnectionResult.SUCCESS
//    and surfacing ProviderOutcome.Unavailable otherwise - needs a Context, so it belongs in the
//    module or in a provider constructor parameter.
// 4. FallbackLocationProvider default ordering: decide where HMS sits (e.g. GMS -> HMS -> Android).
// 5. JS surface: regenerate types / add `Huawei()` to the LocationProvider statics (also in the
//    Swift skeleton to keep the surfaces mirrored) + an NCL provider button.

fun LocationPriority.toHmsPriority(): Int = when (this) {
  LocationPriority.HIGH_ACCURACY -> LocationRequest.PRIORITY_HIGH_ACCURACY
  LocationPriority.BALANCED_POWER_ACCURACY -> LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
  LocationPriority.LOW_POWER -> LocationRequest.PRIORITY_LOW_POWER
  LocationPriority.PASSIVE -> LocationRequest.PRIORITY_NO_POWER
}

class HuaweiLocationProvider(
  val fusedLocationProvider: FusedLocationProviderClient
): LocationProvider {
  override fun name(): String {
    return "Huawei"
  }
  // HMS has no getCurrentLocation(priority, token) one-shot like modern GMS - the canonical
  // pattern is a single-update subscription (setNumUpdates(1)), same shape as the pre-API-30
  // path in AndroidLocationProvider, and like there the fix may never come (e.g. indoors),
  // hence the timeout.
  @SuppressLint("MissingPermission")
  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    val request = LocationRequest.create()
      .setPriority(options.priority.toHmsPriority())
      .setNumUpdates(1)

    val location: Location? = withTimeoutOrNull(options.timeout) {
      suspendCancellableCoroutine { continuation ->
        val callback = object: LocationCallback() {
          override fun onLocationResult(result: LocationResult) {
            fusedLocationProvider.removeLocationUpdates(this)
            if (continuation.isActive) {
              continuation.resume(result.lastLocation)
            }
          }
        }

        fusedLocationProvider
          .requestLocationUpdates(request, callback, Looper.getMainLooper())
          .addOnFailureListener {
            fusedLocationProvider.removeLocationUpdates(callback)
            if (continuation.isActive) {
              continuation.resume(null)
            }
          }
        continuation.invokeOnCancellation { fusedLocationProvider.removeLocationUpdates(callback) }
      }
    }

    if (location == null) {
      return ProviderResult.Unavailable
    }
    return ProviderResult.Success(location.toPosition())
  }

  override fun watchPosition(): ProviderResult<WatchSession> {
    return ProviderResult.Success(HmsWatchSession(fusedLocationProvider))
  }

  override suspend fun enableLocationServices(activity: Activity, storeContinuationObject: (Continuation<Boolean>) -> Unit): ProviderResult<Boolean> {
    return ProviderResult.Unavailable
  }
}

private class HmsWatchSession(
  private val fusedLocationProvider: FusedLocationProviderClient
): WatchSession {
  private var callback: LocationCallback? = null

  @SuppressLint("MissingPermission")
  override fun startUpdates(parameters: WatchPositionParameters, onPosition: (Position) -> Unit) {
    val locationRequest = LocationRequest.create()
      .setPriority(parameters.priority.toHmsPriority())
      .setInterval(parameters.interval.inWholeMilliseconds)
      .setMaxWaitTime(parameters.maxUpdateDelay.inWholeMilliseconds)
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

class HmsModule: Module() {
  lateinit  var mContext: Context
  val locationProvider: SharedRef<LocationProvider> by lazy {
    val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(mContext)
    val hmsLocationProvider = HuaweiLocationProvider(fusedLocationProvider)
    SharedRef(hmsLocationProvider)
  }
  override fun definition() = ModuleDefinition {
    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    }

    Function("get") { ->
      locationProvider
    }
  }
}
