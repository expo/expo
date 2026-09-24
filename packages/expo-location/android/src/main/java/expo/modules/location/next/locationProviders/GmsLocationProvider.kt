package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.app.Activity
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Looper
import android.util.Log
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationAvailability
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.LocationSettingsRequest
import com.google.android.gms.location.Priority
import com.google.android.gms.location.SettingsClient
import com.google.android.gms.tasks.Task
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.next.BatchedPositions
import expo.modules.location.next.LocationTaskConsumer
import expo.modules.location.next.Position
import expo.modules.location.next.SETTINGS_REQUEST_CODE
import expo.modules.location.next.toPosition
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

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
  val isServiceAvailable: () -> Boolean,
) : LocationProvider {
  override fun name(): String {
    return "GMS"
  }

  @SuppressLint("MissingPermission")
  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    if (!isServiceAvailable()) return ProviderResult.Unsupported

    var location: Location? = if (options.timeout > Duration.ZERO) {
      val request = CurrentLocationRequest.Builder()
        .setPriority(options.priority.toGmsPriority())
        .setDurationMillis(options.timeout.inWholeMilliseconds)
        .setMaxUpdateAgeMillis(options.maxCachedAge.inWholeMilliseconds)
        .build()
      fusedLocationProvider.getCurrentLocation(request, null).awaitOrNull()
    } else null

    location = location ?: fusedLocationProvider.lastLocation.awaitOrNull()
    return location?.let {
      ProviderResult.Success(it.toPosition())
    } ?: ProviderResult.Unavailable
  }

  override fun watchPosition(): ProviderResult<WatchSession> {
    if (!isServiceAvailable()) return ProviderResult.Unsupported
    return ProviderResult.Success(GmsWatchSession(fusedLocationProvider))
  }

  override suspend fun enableLocationServices(activity: Activity, promptResult: CompletableDeferred<Boolean>): ProviderResult<Unit> {
    if (!isServiceAvailable()) return ProviderResult.Unsupported
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
      promptResult.complete(true)
      return ProviderResult.Success(Unit)
    }
    try {
      activity.startIntentSenderForResult(
        resolvable.resolution.intentSender,
        SETTINGS_REQUEST_CODE,
        null, 0, 0, 0
      )
    } catch (e: Throwable) {
      promptResult.complete(false)
    }
    return ProviderResult.Success(Unit)
  }

  override fun getLocationTaskConsumerClass(): ProviderResult<Class<out TaskConsumer>> {
    return ProviderResult.Success(GmsLocationTaskConsumer::class.java)
  }
}

private class GmsWatchSession(
  private val fusedLocationProvider: FusedLocationProviderClient
) : WatchSession {
  @Volatile
  private var callback: LocationCallback? = null

  @SuppressLint("MissingPermission")
  @Synchronized
  override fun startUpdates(parameters: WatchPositionParameters, onUpdate: (WatchUpdate) -> Unit): Boolean {
    stopUpdates()
    val locationRequest = LocationRequest
      .Builder(parameters.priority.toGmsPriority(), parameters.interval.inWholeMilliseconds)
      .setMaxUpdateDelayMillis(parameters.maxUpdateDelay.inWholeMilliseconds)
      .build()
    val locationCallback = object: LocationCallback() {
      override fun onLocationResult(locationResult: LocationResult) {
        if (callback != this) return
        locationResult.lastLocation?.let {
          onUpdate(WatchUpdate.Fix(it.toPosition()))
          available = true
        }
      }

      override fun onLocationAvailability(availability: LocationAvailability) {
        if (callback != this) return
        available = availability.isLocationAvailable
      }
    }
    callback = locationCallback
    available = true
    fusedLocationProvider
      .requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
      .addOnFailureListener {
        synchronized(this) {
          if (callback == locationCallback) {
            available = false
            callback = null
            onUpdate(WatchUpdate.Failure(it))
          }
        }
      }
    return true
  }

  @Synchronized
  override fun stopUpdates() {
    callback?.let { fusedLocationProvider.removeLocationUpdates(it) }
    callback = null
    available = false
  }

  @Synchronized
  override fun isSubscribed(): Boolean = callback != null

  @Volatile
  var available = false
  override fun canDeliverUpdates(): Boolean = available
}

class GmsLocationTaskConsumer(context: Context, taskManagerUtils: TaskManagerUtilsInterface?) : LocationTaskConsumer(
  context,
  taskManagerUtils
) {
  private val fusedLocationProvider: FusedLocationProviderClient by lazy {
    LocationServices.getFusedLocationProviderClient(context)
  }
  override fun requestLocationUpdates(pendingIntent: PendingIntent): Boolean {
    // TODO(@HubertBer): add error handling everywhere in this function
    // TODO(@HubertBer): add proper options in here
    val request = LocationRequest.Builder(
      Priority.PRIORITY_HIGH_ACCURACY,
      1.seconds.inWholeMilliseconds
    ).setMaxUpdateDelayMillis(5.seconds.inWholeMilliseconds)
      .build()

    try {
      fusedLocationProvider.requestLocationUpdates(request, pendingIntent)
      return true
    } catch (e: SecurityException) {}
    return false
  }

  override fun stopLocationUpdates(pendingIntent: PendingIntent) {
    fusedLocationProvider.removeLocationUpdates(pendingIntent)
  }

  override fun decodeBatchedPositions(intent: Intent?): BatchedPositions {
    intent ?: return BatchedPositions(null, "Received a location broadcast without an intent.")

    val positions = LocationResult.extractResult(intent)?.locations?.takeIf { it.isNotEmpty() }
    if (positions != null) {
      return BatchedPositions(positions.map { it.toPosition() }, null)
    }

    val availability = LocationAvailability.extractLocationAvailability(intent)
    if (availability != null && !availability.isLocationAvailable) {
      return BatchedPositions(null, "Location is currently unavailable.")
    }

    return BatchedPositions(null, null)
  }
}
