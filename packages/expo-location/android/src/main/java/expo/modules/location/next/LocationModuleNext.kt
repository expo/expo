package expo.modules.location.next

import android.content.Context
import android.location.LocationManager
import android.os.Build
import android.util.Log
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.next.locationForegroundService.BackgroundSessionOptions
import expo.modules.location.next.locationForegroundService.BackgroundSessionState
import expo.modules.location.next.locationForegroundService.LocationForegroundService
import expo.modules.location.next.locationForegroundService.ServicePromotionFailedException
import expo.modules.location.next.locationForegroundService.ServicePromotionResult
import expo.modules.location.next.locationForegroundService.ServicePromotionTimedOutException
import expo.modules.location.next.locationForegroundService.SessionState
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.EnableLocationServicesResult
import expo.modules.location.next.locationProviders.FallbackLocationProvider
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.next.locationProviders.LocationProvider
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import expo.modules.location.next.locationProviders.WatchPositionParameters
import expo.modules.location.next.locationProviders.PositionUpdatesSession
import java.lang.ref.WeakReference
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

private const val MISSING_NOTIFICATION_PERMISSION_WARNING =
  "Starting the location foreground service without the `android.permission.POST_NOTIFICATIONS` " +
    "permission. The service runs and location updates are not throttled, but its notification " +
    "does not appear in the notification drawer."

class LocationModuleNext : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw NoPermissionsModuleException()

  val watchSessions: MutableList<WeakReference<PausableWatchSession>> = mutableListOf()
  val fusedLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(context)

    val gmsLocationProvider = GmsLocationProvider(
      fusedLocationProvider,
      LocationServices.getSettingsClient(context)
    ) { GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS }

    SharedRef(gmsLocationProvider)
  }

  val androidLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    SharedRef(AndroidLocationProvider(context))
  }
  lateinit var currentLocationProvider: LocationProvider

  lateinit var locationManager: LocationManager

  @Volatile
  private var locationServicesPrompt: CompletableDeferred<Boolean>? = null

  @Volatile
  var isForegrounded = false

  private fun shouldWatchersRun() = isForegrounded || LocationForegroundService.isBackgroundLocationUnthrottled()

  private fun updateWatchSessions() = synchronized(watchSessions) {
    watchSessions.removeIf { it.get() == null }
    val areUpdatesAllowed = shouldWatchersRun()
    for (session in watchSessions) {
      session.get()?.setUpdatesAllowed(areUpdatesAllowed)
    }
  }

  fun createPositionWatchHandle(initialParameters: WatchPositionParameters, session: PositionUpdatesSession): PositionWatchHandle = synchronized(watchSessions) {
    val areUpdatesAllowed = shouldWatchersRun()
    val pausableSession = PausableWatchSession(initialParameters, session, areUpdatesAllowed)
    watchSessions.add(WeakReference(pausableSession))
    return@synchronized PositionWatchHandle(pausableSession)
  }

  override fun definition() = ModuleDefinition {
    Name("LocationModuleNext")

    OnCreate {
      currentLocationProvider = FallbackLocationProvider(
        listOf(fusedLocationProviderInstance.ref, androidLocationProviderInstance.ref)
      )
      locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    }

    // Permissions
    AsyncFunction("requestForegroundPermissions") Coroutine { options: RequestPermissionsOptions? ->
      permissionsManager.requestForegroundPermissions(options)
      return@Coroutine permissionsManager.getLocationPermissions(background = false)
    }

    AsyncFunction("getForegroundPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getLocationPermissions(background = false)
    }

    AsyncFunction("requestBackgroundPermissions") Coroutine { _: RequestPermissionsOptions? ->
      permissionsManager.requestBackgroundPermissions()
      return@Coroutine permissionsManager.getLocationPermissions(background = true)
    }

    AsyncFunction("getBackgroundPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getLocationPermissions(background = true)
    }

    AsyncFunction("requestNotificationPermissions") Coroutine { ->
      permissionsManager.requestNotificationPermissions()
      return@Coroutine permissionsManager.getNotificationPermissions(context)
    }

    AsyncFunction("getNotificationPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getNotificationPermissions(context)
    }

    // Location providers
    Function("setLocationProvider") { locationProvider: SharedRef<LocationProvider> ->
      currentLocationProvider = locationProvider.ref
    }

    Function("getSelectedLocationProviderName") {
      currentLocationProvider.name
    }

    Class("LocationProvider") {
      StaticFunction("Gms") { ->
        fusedLocationProviderInstance
      }
      StaticFunction("Android") { ->
        androidLocationProviderInstance
      }
      StaticFunction("Fallback") { providers: List<SharedRef<LocationProvider>> ->
        SharedRef(FallbackLocationProvider(providers.map { it.ref }))
      }
    }

    AsyncFunction("getPosition") Coroutine { options: GetPositionOptions? ->
      permissionsManager.ensureForegroundPermissions()
      val providerOptions = (options ?: GetPositionOptions()).toProviderOptions()
      return@Coroutine currentLocationProvider.getPosition(providerOptions).getOrNull("getPosition")
    }

    Function("watchPosition") { profile: LocationProfile? ->
      permissionsManager.ensureForegroundPermissions()
      val parameters = (profile ?: LocationProfile.DEFAULT).watchParameters()
      return@Function createPositionWatchHandle(parameters, currentLocationProvider.watchPosition().getOrThrow("watchPosition"))
    }

    Function("hasLocationServicesEnabled") { ->
      hasLocationServicesEnabled()
    }

    AsyncFunction("enableLocationServices") Coroutine { ->
      if (hasLocationServicesEnabled()) {
        return@Coroutine true
      }
      locationServicesPrompt?.let {
        return@Coroutine it.await()
      }

      val promptResult = CompletableDeferred<Boolean>()
      locationServicesPrompt = promptResult
      try {
        val enableServicesResult = currentLocationProvider
          .enableLocationServices(appContext.throwingActivity)
          .getOrThrow("enableLocationServices")

        when (enableServicesResult) {
          is EnableLocationServicesResult.Disabled -> promptResult.complete(false)
          is EnableLocationServicesResult.Enabled -> promptResult.complete(true)
          is EnableLocationServicesResult.ResolutionPending -> {}
        }

        return@Coroutine promptResult.await()
      } catch (cause: Throwable) {
        promptResult.completeExceptionally(cause)
        throw cause
      } finally {
        locationServicesPrompt = null
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode == SETTINGS_REQUEST_CODE) {
        locationServicesPrompt?.complete(hasLocationServicesEnabled())
      }
    }

    Class("BackgroundSession") {
      StaticAsyncFunction("ensureStarted") Coroutine { backgroundSessionOptions: BackgroundSessionOptions? ->
        if (!LocationForegroundService.isForegroundServiceRequired) {
          return@Coroutine
        }
        permissionsManager.ensureForegroundServicePermissions()
        if (!permissionsManager.hasNotificationPermission()) {
          Log.w("ExpoLocation", MISSING_NOTIFICATION_PERMISSION_WARNING)
        }

        val requested = backgroundSessionOptions
        val options = if (requested != null) {
          BackgroundSessionOptions.persist(context, requested)
          requested
        } else {
          BackgroundSessionOptions.readPersisted(context)
            ?: BackgroundSessionOptions().also { BackgroundSessionOptions.persist(context, it) }
        }

        val sessionState = LocationForegroundService.startOrUpdate(context, options, updateOnly = !isForegrounded)
        if (sessionState !is SessionState.Starting) {
          return@Coroutine
        }

        when (val result = withTimeoutOrNull(4.seconds) { sessionState.promotion.await() }) {
          is ServicePromotionResult.Failed ->
            throw result.cause as? CodedException ?: ServicePromotionFailedException(result.cause)
          ServicePromotionResult.Promoted -> {}
          null -> throw ServicePromotionTimedOutException()
        }
      }

      StaticAsyncFunction("stop") Coroutine { ->
        val currentState = LocationForegroundService.state
        if (currentState is SessionState.Starting) {
          withTimeoutOrNull(4.seconds) { currentState.promotion.await() }
        }
        LocationForegroundService.stop(context)
      }

      StaticFunction("status") {
        LocationForegroundService.status()
      }
    }

    Class(PositionWatchHandle::class) {
      Constructor {
        throw PositionWatchHandleCreationException()
      }

      Events(POSITION_CHANGED)

      Function("pause") { locationWatchHandle: PositionWatchHandle ->
        locationWatchHandle.session.pause()
      }

      Function("resume") { locationWatchHandle: PositionWatchHandle ->
        return@Function locationWatchHandle.session.resume()
      }

      Function("withProfile") { locationWatchHandle: PositionWatchHandle, profile: LocationProfile ->
        locationWatchHandle.session.withProfile(profile)
        locationWatchHandle
      }

      Function("withInterval") { locationWatchHandle: PositionWatchHandle, interval: Duration ->
        if (interval < Duration.ZERO || interval == Duration.INFINITE) {
          throw InvalidWatchIntervalException(interval)
        }
        locationWatchHandle.session.withInterval(interval)
        locationWatchHandle
      }

      Function("restart") { locationWatchHandle: PositionWatchHandle ->
        return@Function locationWatchHandle.session.restart()
      }

      Function("status") { locationWatchHandle: PositionWatchHandle ->
        locationWatchHandle.session.status()
      }
    }

    OnDestroy {
      pollForegroundServiceJob?.cancel()
      synchronized(watchSessions) {
        for (session in watchSessions) {
          session.get()?.release()
        }
      }
    }

    OnActivityEntersForeground {
      isForegrounded = true
      updateWatchSessions()

      appContext.backgroundCoroutineScope.launch {
        try {
          BackgroundSessionOptions.readPersisted(context)?.let {
            permissionsManager.ensureForegroundServicePermissions()
            val sessionState = LocationForegroundService.startOrUpdate(context, it, updateOnly = !isForegrounded)
            if (sessionState is SessionState.Starting) {
              sessionState.promotion.await()
              updateWatchSessions()
            }
          }
        } catch (e: CancellationException) {
          throw e
        } catch (e: Exception) {
          Log.w("ExpoLocation", "Could not restart the background session after entering the foreground", e)
        }
      }
    }

    OnActivityEntersBackground {
      isForegrounded = false
      updateWatchSessions()
      startPollingForegroundService()
    }
  }

  private var pollForegroundServiceJob: Job? = null

  // Poll the foreground service so that if it promotes or dies we can update the watch sessions.
  private fun startPollingForegroundService() {
    if (pollForegroundServiceJob != null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    pollForegroundServiceJob = appContext.mainQueue.launch {
      var previousAreUpdatesAllowed: Boolean? = null
      while (isActive) {
        val areUpdatesAllowed = shouldWatchersRun()

        if (areUpdatesAllowed != previousAreUpdatesAllowed) {
          updateWatchSessions()
        }

        if (LocationForegroundService.status().state == BackgroundSessionState.NOT_RUNNING || isForegrounded) {
          pollForegroundServiceJob = null
          return@launch
        }

        previousAreUpdatesAllowed = areUpdatesAllowed
        delay(1.seconds)
      }
    }
  }

  private fun hasLocationServicesEnabled(): Boolean {
    return LocationManagerCompat.isLocationEnabled(locationManager)
  }
}
