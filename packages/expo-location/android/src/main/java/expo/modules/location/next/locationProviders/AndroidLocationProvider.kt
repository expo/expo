package expo.modules.location.next.locationProviders

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.content.IntentCompat
import androidx.core.location.LocationListenerCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.location.LocationRequestCompat
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.next.BatchedPositions
import expo.modules.location.next.LocationTaskConsumer
import expo.modules.location.next.Position
import expo.modules.location.next.SETTINGS_REQUEST_CODE
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume
import kotlin.time.Duration

private fun getPermittedSystemProviders(context: Context, locationManager: LocationManager, enabledOnly: Boolean): List<String> {
  val fineGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
  val providers = locationManager.getProviders(enabledOnly)
  // Avoid GPS_PROVIDER, when only coarse permissions are given.
  return providers.filter {
    it != LocationManager.GPS_PROVIDER || fineGranted
  }
}

private fun getValidSystemProviders(context: Context, locationManager: LocationManager): List<String> =
  getPermittedSystemProviders(context, locationManager, enabledOnly = true)

private fun downgradeSystemProvider(provider: String) = when (provider) {
  LocationManager.FUSED_PROVIDER -> LocationManager.GPS_PROVIDER
  LocationManager.GPS_PROVIDER -> LocationManager.NETWORK_PROVIDER
  LocationManager.NETWORK_PROVIDER -> LocationManager.PASSIVE_PROVIDER
  else -> null
}

fun LocationPriority.toQuality(): Int {
  return when (this) {
    LocationPriority.HIGH_ACCURACY -> LocationRequestCompat.QUALITY_HIGH_ACCURACY
    LocationPriority.BALANCED_POWER_ACCURACY -> LocationRequestCompat.QUALITY_BALANCED_POWER_ACCURACY
    LocationPriority.LOW_POWER, LocationPriority.PASSIVE -> LocationRequestCompat.QUALITY_LOW_POWER
  }
}

private fun desiredSystemProvider(locationPriority: LocationPriority): String {
  // Pick the desired provider based on LocationPriority options
  return when (locationPriority) {
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
}

private fun resolveProviderFrom(locationPriority: LocationPriority, validProviders: List<String>): String? {
  // Downgrade provider if it is not valid.
  var provider: String? = desiredSystemProvider(locationPriority)
  while (provider != null && provider !in validProviders) {
    provider = downgradeSystemProvider(provider)
  }
  return provider
}

fun resolveSystemProviderName(locationPriority: LocationPriority, context: Context, locationManager: LocationManager): String? =
  resolveProviderFrom(locationPriority, getValidSystemProviders(context, locationManager))

class AndroidLocationProvider(private val context: Context) : LocationProvider {
  val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

  override val name = "Android"

  @SuppressLint("MissingPermission")
  private fun getLastKnownLocation(): Location? {
    return getValidSystemProviders(context, locationManager)
      .mapNotNull { locationManager.getLastKnownLocation(it) }
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
      ?.let { ProviderResult.Available(it.toPosition()) }
      ?: ProviderResult.Unavailable
    val validCachedResult = lastLocation !== null && SystemClock.elapsedRealtimeNanos() - lastLocation.elapsedRealtimeNanos < options.maxCachedAge.inWholeNanoseconds
    if (validCachedResult || options.timeout == Duration.ZERO) {
      return lastPositionResult
    }

    val provider = resolveSystemProviderName(options.priority, context, locationManager) ?: return lastPositionResult
    val currentLocation = getCurrentLocationWithTimeout(provider, options.timeout)
    val currentPosition = currentLocation?.toPosition() ?: return lastPositionResult
    return ProviderResult.Available(currentPosition)
  }

  override fun watchPosition(): ProviderResult<PositionUpdatesSession> {
    if (getValidSystemProviders(context, locationManager).isEmpty()) {
      return ProviderResult.Unavailable
    }
    return ProviderResult.Available(AndroidPositionUpdatesSession(context, locationManager))
  }

  override fun getLocationTaskConsumerClass(): ProviderResult<Class<out TaskConsumer>> {
    return ProviderResult.Available(AndroidLocationTaskConsumer::class.java)
  }

  override fun getRegisteredTaskConsumerClass(taskManager: TaskManagerInterface, taskName: String): ProviderResult<Class<out TaskConsumer>> {
    if (!taskManager.taskHasConsumerOfClass(taskName, AndroidLocationTaskConsumer::class.java)) {
      return ProviderResult.Unavailable
    }
    return ProviderResult.Available(AndroidLocationTaskConsumer::class.java)
  }

  // On plain android we can only move user to settings.
  override suspend fun enableLocationServices(activity: Activity): ProviderResult<EnableLocationServicesResult> {
    val enableServicesResult = runCatching {
      activity.startActivityForResult(
        Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS),
        SETTINGS_REQUEST_CODE
      )
    }.fold(
      onSuccess = { EnableLocationServicesResult.ResolutionPending },
      onFailure = { EnableLocationServicesResult.Disabled }
    )
    return ProviderResult.Available(enableServicesResult)
  }
}

private class AndroidPositionUpdatesSession(
  private val context: Context,
  private val locationManager: LocationManager
) : PositionUpdatesSession, BroadcastReceiver() {
  private class SessionConfig(val parameters: WatchPositionParameters, val onUpdate: (WatchUpdate) -> Unit)
  private class SessionState(val listener: LocationListenerCompat, val provider: String)

  private var config: SessionConfig? = null
  private var state: SessionState? = null

  private fun clearConfig() {
    if (config != null) {
      config = null
      context.unregisterReceiver(this)
    }
  }

  @SuppressLint("MissingPermission")
  private fun clearState() {
    val oldState = state
    if (oldState != null) {
      state = null
      LocationManagerCompat.removeUpdates(locationManager, oldState.listener)
    }
  }

  @SuppressLint("MissingPermission")
  private fun tryConfiguringListener(config: SessionConfig, provider: String, emitError: Boolean = false): LocationListenerCompat? {
    return runCatching {
      val request = LocationRequestCompat.Builder(config.parameters.interval.inWholeMilliseconds)
        .setQuality(config.parameters.priority.toQuality())
        .setMaxUpdateDelayMillis(config.parameters.maxUpdateDelay.inWholeMilliseconds)
        .build()
      val listener = LocationListenerCompat { location -> config.onUpdate(WatchUpdate.Fix(location.toPosition())) }
      LocationManagerCompat.requestLocationUpdates(locationManager, provider, request, listener, Looper.getMainLooper())
      listener
    }.onFailure {
      if (emitError) {
        config.onUpdate(WatchUpdate.Failure(it))
      }
    }.getOrNull()
  }

  @Synchronized
  override fun startUpdates(parameters: WatchPositionParameters, onUpdate: (WatchUpdate) -> Unit): Boolean {
    clearConfig()
    clearState()

    val provider = resolveSystemProviderName(parameters.priority, context, locationManager)
    val desiredConfig = SessionConfig(parameters, onUpdate)

    val listener = provider?.let { tryConfiguringListener(desiredConfig, it) }
    if (listener != null) {
      state = SessionState(listener, provider)
    }

    ContextCompat.registerReceiver(context, this, IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION), ContextCompat.RECEIVER_NOT_EXPORTED)
    config = desiredConfig

    return listener != null
  }

  @Synchronized
  @SuppressLint("MissingPermission")
  override fun stopUpdates() {
    clearState()
    clearConfig()
  }

  @Synchronized override fun isSubscribed(): Boolean = config != null

  @Synchronized override fun canDeliverUpdates(): Boolean = state != null

  @Synchronized
  @SuppressLint("MissingPermission")
  override fun onReceive(receiverContext: Context?, intent: Intent?) {
    val config = config ?: return
    val currentState = state
    val provider = resolveSystemProviderName(config.parameters.priority, context, locationManager)
    if (currentState != null && currentState.provider == provider) {
      return
    }

    clearState()

    val listener = provider?.let { tryConfiguringListener(config, it, emitError = true) }
    if (listener != null) {
      state = SessionState(listener, provider)
    }
  }
}

class AndroidLocationTaskConsumer(
  context: Context,
  taskManagerUtils: TaskManagerUtilsInterface?
) : LocationTaskConsumer(context, taskManagerUtils) {
  private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

  @SuppressLint("MissingPermission")
  override fun requestLocationUpdates(pendingIntent: PendingIntent, options: BackgroundUpdatesParameters, updateExisting: Boolean): Boolean {
    val locationManager = locationManager ?: return false
    val provider = runCatching {
      resolveProviderFrom(options.priority, getPermittedSystemProviders(context, locationManager, enabledOnly = false))
    }.getOrNull() ?: return false

    return runCatching {
      if (Build.VERSION.SDK_INT >= 31) {
        val request = LocationRequestCompat.Builder(options.interval.inWholeMilliseconds)
          .setQuality(options.priority.toQuality())
          .setMaxUpdateDelayMillis(options.maxUpdateDelay.inWholeMilliseconds)
          .setMinUpdateDistanceMeters(options.minUpdateDistance)
          .build()
          .toLocationRequest()
        locationManager.requestLocationUpdates(provider, request, pendingIntent)
      } else {
        locationManager.requestLocationUpdates(
          provider,
          options.interval.inWholeMilliseconds,
          options.minUpdateDistance,
          pendingIntent
        )
      }
      true
    }.onFailure {
      reportRequestFailed(it)
      Log.w("ExpoLocation", "Could not request background location updates from \"$provider\"", it)
    }.getOrDefault(false)
  }

  @SuppressLint("MissingPermission")
  override fun stopLocationUpdates(pendingIntent: PendingIntent) {
    runCatching {
      locationManager?.removeUpdates(pendingIntent)
      pendingIntent.cancel()
    }.onFailure {
      Log.w("ExpoLocation", "Could not stop background location updates", it)
    }
  }

  override fun decodeBatchedPositions(intent: Intent?): BatchedPositions {
    intent ?: return BatchedPositions(null, "Received a location broadcast without an intent.")
    return runCatching { decodeIntent(intent) }.getOrElse {
      Log.w("ExpoLocation", "Could not decode a location broadcast", it)
      BatchedPositions(null, "Could not read the location update sent by the system.")
    }
  }

  private fun decodeIntent(intent: Intent): BatchedPositions {
    if (Build.VERSION.SDK_INT >= 31) {
      val batch = IntentCompat
        .getParcelableArrayExtra(intent, LocationManager.KEY_LOCATIONS, Location::class.java)
        ?.filterIsInstance<Location>()
        ?.takeIf { it.isNotEmpty() }
      if (batch != null) {
        return BatchedPositions(batch.map { it.toPosition() }, null)
      }
    }

    val location = IntentCompat.getParcelableExtra(intent, LocationManager.KEY_LOCATION_CHANGED, Location::class.java)
    if (location != null) {
      return BatchedPositions(listOf(location.toPosition()), null)
    }

    return BatchedPositions(null, null)
  }
}
