package expo.modules.location.next.locationProviders

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
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
import androidx.core.content.ContextCompat
import androidx.core.location.LocationListenerCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.location.LocationRequestCompat
import expo.modules.location.next.Position
import expo.modules.location.next.SETTINGS_REQUEST_CODE
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume
import kotlin.time.Duration

fun LocationPriority.toQuality(): Int {
  return when (this) {
    LocationPriority.HIGH_ACCURACY -> LocationRequestCompat.QUALITY_HIGH_ACCURACY
    LocationPriority.BALANCED_POWER_ACCURACY -> LocationRequestCompat.QUALITY_BALANCED_POWER_ACCURACY
    LocationPriority.LOW_POWER, LocationPriority.PASSIVE -> LocationRequestCompat.QUALITY_LOW_POWER
  }
}

fun resolveSystemProviderName(locationPriority: LocationPriority, context: Context, locationManager: LocationManager): String? {
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
  var provider: String? = desiredProvider
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

  override val name = "Android"

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

    val provider = resolveSystemProviderName(options.priority, context, locationManager) ?: return lastPositionResult
    val currentLocation = getCurrentLocationWithTimeout(provider, options.timeout)
    val currentPosition = currentLocation?.toPosition() ?: return lastPositionResult
    return ProviderResult.Success(currentPosition)
  }


  override fun watchPosition(): ProviderResult<WatchSession> {
    if (locationManager.getProviders(true).isEmpty()) {
      return ProviderResult.Unavailable
    }
    return ProviderResult.Success(AndroidWatchSession(context, locationManager))
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
    return ProviderResult.Success(enableServicesResult)
  }
}

private class AndroidWatchSession(
  private val context: Context,
  private val locationManager: LocationManager,
) : WatchSession, BroadcastReceiver() {
  private class SessionConfig(val parameters: WatchPositionParameters, val onUpdate: (WatchUpdate) -> Unit)
  private class SessionState(val listener: LocationListenerCompat, val provider: String)

  private var mConfig: SessionConfig? = null
  private var mState: SessionState? = null

  private fun clearConfig() {
    if (mConfig != null) {
      mConfig = null
      context.unregisterReceiver(this)
    }
  }

  @SuppressLint("MissingPermission")
  private fun clearState() {
    val state = mState
    if (state != null) {
      mState = null
      LocationManagerCompat.removeUpdates(locationManager, state.listener)
    }
  }

  @SuppressLint("MissingPermission")
  private fun tryConfiguringListener(config: SessionConfig, provider: String, emitError: Boolean = false): LocationListenerCompat? {
    return try {
      val request = LocationRequestCompat.Builder(config.parameters.interval.inWholeMilliseconds)
        .setQuality(config.parameters.priority.toQuality())
        .setMaxUpdateDelayMillis(config.parameters.maxUpdateDelay.inWholeMilliseconds)
        .build()
      val listener = LocationListenerCompat { location -> config.onUpdate(WatchUpdate.Fix(location.toPosition())) }
      LocationManagerCompat.requestLocationUpdates(locationManager, provider, request, listener, Looper.getMainLooper())
      listener
    } catch (cause: Throwable) {
      if (emitError) {
        config.onUpdate(WatchUpdate.Failure(cause))
      }
      null
    }
  }

  @Synchronized
  override fun startUpdates(parameters: WatchPositionParameters, onUpdate: (WatchUpdate) -> Unit): Boolean {
    clearConfig()
    clearState()
    val provider = resolveSystemProviderName(parameters.priority, context, locationManager)
    val desiredConfig = SessionConfig(parameters, onUpdate)

    val listener = provider?.let { tryConfiguringListener(desiredConfig, it) }
    if (listener != null) {
      mState = SessionState(listener, provider)
    }

    ContextCompat.registerReceiver(context, this, IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION), ContextCompat.RECEIVER_NOT_EXPORTED)
    mConfig = desiredConfig

    return listener != null
  }

  @Synchronized
  @SuppressLint("MissingPermission")
  override fun stopUpdates() {
    clearState()
    clearConfig()
  }

  @Synchronized override fun isSubscribed(): Boolean = mConfig != null
  @Synchronized override fun canDeliverUpdates(): Boolean = mState != null

  @Synchronized @SuppressLint("MissingPermission")
  override fun onReceive(receiverContext: Context?, intent: Intent?) {
    val config = mConfig ?: return
    val state = mState
    val provider = resolveSystemProviderName(config.parameters.priority, context, locationManager)
    if (state != null && state.provider == provider) {
      return
    }

    clearState()

    val listener = provider?.let { tryConfiguringListener(config, it, emitError = true) }
    if (listener != null) {
      mState = SessionState(listener, provider)
    }
  }
}
