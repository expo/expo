package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.location.Location
import android.os.Looper
import com.huawei.hms.api.ConnectionResult
import com.huawei.hms.api.HuaweiApiAvailability
import com.huawei.hms.location.LocationServices
import com.huawei.hms.location.FusedLocationProviderClient
import com.huawei.hms.location.LocationCallback
import com.huawei.hms.location.LocationRequest
import com.huawei.hms.location.LocationResult
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.next.Position
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

fun LocationPriority.toHmsPriority(): Int = when (this) {
  LocationPriority.HIGH_ACCURACY -> LocationRequest.PRIORITY_HIGH_ACCURACY
  LocationPriority.BALANCED_POWER_ACCURACY -> LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
  LocationPriority.LOW_POWER -> LocationRequest.PRIORITY_LOW_POWER
  LocationPriority.PASSIVE -> LocationRequest.PRIORITY_NO_POWER
}

class HuaweiLocationProvider(
  val fusedLocationProvider: FusedLocationProviderClient,
  val isServiceAvailable: () -> Boolean
) : LocationProvider {
  override val name = "Huawei"

  @SuppressLint("MissingPermission")
  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    if (!isServiceAvailable()) {
      return ProviderResult.Unsupported
    }
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
    return ProviderResult.Available(location.toPosition())
  }

  override fun watchPosition(): ProviderResult<PositionUpdatesSession> {
    if (!isServiceAvailable()) {
      return ProviderResult.Unsupported
    }
    return ProviderResult.Available(HmsWatchSession(fusedLocationProvider))
  }

  override suspend fun enableLocationServices(activity: Activity): ProviderResult<EnableLocationServicesResult> {
    if (!isServiceAvailable()) {
      return ProviderResult.Unsupported
    }
    return ProviderResult.Unavailable
  }
}

private class HmsWatchSession(
  private val fusedLocationProvider: FusedLocationProviderClient
) : PositionUpdatesSession {
  private var callback: LocationCallback? = null

  @SuppressLint("MissingPermission")
  override fun startUpdates(parameters: WatchPositionParameters, onUpdate: (WatchUpdate) -> Unit): Boolean {
    stopUpdates()
    val locationRequest = LocationRequest.create()
      .setPriority(parameters.priority.toHmsPriority())
      .setInterval(parameters.interval.inWholeMilliseconds)
      .setMaxWaitTime(parameters.maxUpdateDelay.inWholeMilliseconds)
    val callback = object: LocationCallback() {
      override fun onLocationResult(locationResult: LocationResult) {
        locationResult.lastLocation?.let {
          onUpdate(WatchUpdate.Fix(it.toPosition()))
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

  override fun isSubscribed(): Boolean = callback != null

  override fun canDeliverUpdates(): Boolean = callback != null
}

class HmsModule : Module() {
  lateinit var mContext: Context
  val locationProvider: SharedRef<LocationProvider> by lazy {
    val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(mContext)
    val hmsLocationProvider = HuaweiLocationProvider(fusedLocationProvider) {
      HuaweiApiAvailability.getInstance().isHuaweiMobileServicesAvailable(mContext) == ConnectionResult.SUCCESS
    }
    SharedRef(hmsLocationProvider)
  }
  override fun definition() = ModuleDefinition {
    Name("HmsModule")

    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    }

    Function("get") { ->
      locationProvider
    }
  }
}
