package expo.modules.location.next

import android.content.Context
import android.content.Intent
import android.location.LocationManager
import android.os.Build
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.EnableLocationServicesResult
import expo.modules.location.next.locationProviders.FallbackLocationProvider
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.next.locationProviders.LocationProvider
import kotlinx.coroutines.CompletableDeferred
import expo.modules.location.next.locationProviders.WatchPositionParameters
import expo.modules.location.next.locationProviders.PositionUpdatesSession
import java.lang.ref.WeakReference
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class TaskManagerNotFoundException : CodedException("TaskManager module not found")

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
  val taskManager: TaskManagerInterface by lazy {
    return@lazy appContext.legacyModule<TaskManagerInterface>()
      ?: throw TaskManagerNotFoundException()
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
      modulesStarted.incrementAndGet()
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
      return@Coroutine permissionsManager.getNotificationPermissions()
    }

    AsyncFunction("getNotificationPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getNotificationPermissions()
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

    Class("BackgroundLocation") {
      StaticFunction("ensureStarted") { taskName: String ->
        val locationTaskConsumer = currentLocationProvider.getLocationTaskConsumerClass().getOrNull("getLocationTaskConsumerClass")
          ?: return@StaticFunction false
        // TODO(@HubertBer): Add error and permission handling in here.
        // TODO(@HubertBer): Add options in here.
        taskManager.registerTask(taskName, locationTaskConsumer, emptyMap())
      }
      StaticFunction("stop") { taskName: String ->
        val locationTaskConsumer = currentLocationProvider.getLocationTaskConsumerClass().getOrNull("getLocationTaskConsumerClass")
          ?: return@StaticFunction false
        // TODO(@HubertBer): Add error and permission handling in here.
        // TODO(@HubertBer): Add options in here.
        taskManager.unregisterTask(taskName, locationTaskConsumer)
      }
      StaticFunction("status") { taskName: String ->
        true // TODO(@HubertBer): Figure out what status can we report
      }
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
        if (!LocationForegroundService.canPostNotifications(context)) {
          throw MissingNotificationPermissionException()
        }

        val options = backgroundSessionOptions ?: BackgroundSessionOptions()
        BackgroundSessionOptions.persist(context, options)

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
        (LocationForegroundService.state as? SessionState.Starting)?.promotion?.let {
          withTimeoutOrNull(4.seconds) { it.await() }
        }
        BackgroundSessionOptions.clearPersisted(context)
        context.stopService(Intent(context, LocationForegroundService::class.java))
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
      modulesStarted.decrementAndGet()
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

      if (!LocationForegroundService.canPostNotifications(context)) {
        return@OnActivityEntersForeground
      }
      appContext.backgroundCoroutineScope.launch {
        runCatching {
          BackgroundSessionOptions.readPersisted(context)?.let {
            val sessionState = LocationForegroundService.startOrUpdate(context, it, updateOnly = !isForegrounded)
            if (sessionState is SessionState.Starting) {
              sessionState.promotion.await()
              updateWatchSessions()
            }
          }
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

  companion object {
    @Volatile var modulesStarted = AtomicInteger(0)
  }
}
