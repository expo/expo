package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.app.Activity
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Looper
import android.util.Log
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
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.next.BatchedPositions
import expo.modules.location.next.LocationTaskConsumer
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
  private suspend fun getCachedOrCurrentLocation(options: GetCurrentPositionOptions): Location? {
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

    val recentLocation: Location? = if (options.timeout > Duration.ZERO) {
      getCachedOrCurrentLocation(options)
    } else {
      null
    }

    val resultLocation = recentLocation ?: fusedLocationProvider.lastLocation.awaitOrNull()

    return resultLocation?.let {
      ProviderResult.Available(it.toPosition())
    } ?: ProviderResult.Unavailable
  }

  override fun watchPosition(): ProviderResult<PositionUpdatesSession> {
    if (!isServiceAvailable()) {
      return ProviderResult.Unsupported
    }
    return ProviderResult.Available(GmsPositionUpdatesSession(fusedLocationProvider))
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
      return ProviderResult.Available(enableServicesResult)
    } catch (resolvable: ResolvableApiException) {
      val enableServicesResult = runCatching {
        resolvable.startResolutionForResult(activity, SETTINGS_REQUEST_CODE)
      }.fold(
        onSuccess = { EnableLocationServicesResult.ResolutionPending },
        onFailure = { EnableLocationServicesResult.Disabled }
      )
      return ProviderResult.Available(enableServicesResult)
    } catch (e: CancellationException) {
      throw e
    } catch (_: Throwable) {
      return ProviderResult.Unavailable
    }
  }

  override fun getLocationTaskConsumerClass(): ProviderResult<Class<out TaskConsumer>> {
    if (!isServiceAvailable()) {
      return ProviderResult.Unavailable
    }
    return ProviderResult.Available(GmsLocationTaskConsumer::class.java)
  }

  override fun getRegisteredTaskConsumerClass(taskManager: TaskManagerInterface, taskName: String): ProviderResult<Class<out TaskConsumer>> {
    if (!taskManager.taskHasConsumerOfClass(taskName, GmsLocationTaskConsumer::class.java)) {
      return ProviderResult.Unavailable
    }
    return ProviderResult.Available(GmsLocationTaskConsumer::class.java)
  }
}

private class GmsPositionUpdatesSession(
  private val fusedLocationProvider: FusedLocationProviderClient
) : PositionUpdatesSession {
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

    val locationCallback = object : LocationCallback() {
      override fun onLocationResult(locationResult: LocationResult) {
        if (callback != this) {
          return
        }
        locationResult.lastLocation?.let {
          onUpdate(WatchUpdate.Fix(it.toPosition()))
          available = true
        }
      }

      override fun onLocationAvailability(availability: LocationAvailability) {
        if (callback != this) {
          return
        }
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

  @SuppressLint("MissingPermission")
  override fun requestLocationUpdates(pendingIntent: PendingIntent, options: BackgroundUpdatesParameters, updateExisting: Boolean): Boolean {
    try {
      val request = LocationRequest.Builder(
        options.priority.toGmsPriority(),
        options.interval.inWholeMilliseconds
      ).setMaxUpdateDelayMillis(options.maxUpdateDelay.inWholeMilliseconds)
        .setMinUpdateDistanceMeters(options.minUpdateDistance)
        .build()

      fusedLocationProvider
        .requestLocationUpdates(request, pendingIntent)
        .addOnFailureListener {
          reportRequestFailed(it)
        }
      return true
    } catch (e: Exception) {
      reportRequestFailed(e)
      return false
    }
  }

  override fun stopLocationUpdates(pendingIntent: PendingIntent) {
    runCatching {
      fusedLocationProvider
        .removeLocationUpdates(pendingIntent)
    }
  }

  override fun decodeBatchedPositions(intent: Intent?): BatchedPositions {
    if (intent == null) {
      return BatchedPositions(null, "Received a location broadcast without an intent.")
    }

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
