package expo.modules.location.next

import android.content.Context
import android.content.Intent
import android.location.LocationManager
import android.os.Bundle
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
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.TaskManagerNotFoundException
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.FallbackLocationProvider
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.next.locationProviders.LocationProvider
import kotlinx.coroutines.CompletableDeferred
import expo.modules.location.next.locationProviders.WatchPositionParameters
import expo.modules.location.next.locationProviders.WatchSession
import java.lang.ref.WeakReference
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.atomic.AtomicInteger

class RequestingBackgroundPermissionsWithoutForegroundGrantException : CodedException("Need to have foreground permissions granted, before asking for background permissions! Call requestForegroundPermissions() first and make sure the foreground location is granted.")
class BackgroundSessionRequiresForegroundException : CodedException("Need to be in foreground to ask for starting the background session.")
class ServicePromotionFailedException(cause: Throwable) : CodedException(cause.localizedMessage, cause)
class ServicePromotionTimedOutException : CodedException("Service promotion has timed out, need to check the background activity status to check if the service actually promoted in a later time.")
class NoNotificationIconException : CodedException("No notification icon was configured.")
class TaskManagerNotFoundException : CodedException("TaskManager module not found")

class LocationModuleNext : Module() {
  lateinit var mContext: Context
  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw NoPermissionsModuleException()
  val sessionsLock = Any()
  val watchSessions: MutableList<WeakReference<PausableWatchSession>> = mutableListOf()
  val fusedLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(mContext)
    val gmsLocationProvider = GmsLocationProvider(
      fusedLocationProvider,
      LocationServices.getSettingsClient(mContext)
    ) { GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(mContext) == ConnectionResult.SUCCESS }

    SharedRef(gmsLocationProvider)
  }
  val androidLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    SharedRef(AndroidLocationProvider(mContext))
  }
  val taskManager: TaskManagerInterface by lazy {
    return@lazy appContext.legacyModule<TaskManagerInterface>()
      ?: throw TaskManagerNotFoundException()
  }
  lateinit var currentLocationProvider: LocationProvider
  lateinit var locationManager: LocationManager
  @Volatile
  private var locationServicesPrompt: CompletableDeferred<Boolean>? = null
  var isForegrounded = false

  fun createPositionWatchHandle(initialParameters: WatchPositionParameters, session: WatchSession): PositionWatchHandle = synchronized(sessionsLock) {
    val pausableSession = PausableWatchSession(initialParameters, session)
    watchSessions.add(WeakReference(pausableSession))
    return@synchronized PositionWatchHandle(pausableSession)
  }

  override fun definition() = ModuleDefinition {
    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      currentLocationProvider = FallbackLocationProvider(
        listOf(fusedLocationProviderInstance.ref, androidLocationProviderInstance.ref)
      )
      locationManager = mContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
      modulesStarted.incrementAndGet()
    }

    // Permissions
    AsyncFunction("requestForegroundPermissions") Coroutine { options: RequestForegroundPermissionsOptions? ->
      permissionsManager.requestForegroundPermissions(options)
      return@Coroutine permissionsManager.getLocationPermissions(background = false)
    }

    AsyncFunction("getForegroundPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getLocationPermissions(background = false)
    }

    AsyncFunction("requestBackgroundPermissions") Coroutine { ->
      permissionsManager.requestBackgroundPermissions()
      return@Coroutine permissionsManager.getLocationPermissions(background = true)
    }

    AsyncFunction("getBackgroundPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getLocationPermissions(background = true)
    }

    // Location providers
    Function("setLocationProvider") { locationProvider: SharedRef<LocationProvider> ->
      currentLocationProvider = locationProvider.ref
    }

    Function("getSelectedLocationProviderName") { ->
      currentLocationProvider.name()
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
      return@Coroutine currentLocationProvider.getPosition(providerOptions).getOrNull()
    }

    Function("watchPosition") { profile: LocationProfile? ->
      permissionsManager.ensureForegroundPermissions()
      val parameters = (profile ?: LocationProfile.DEFAULT).watchParameters()
      return@Function createPositionWatchHandle(parameters, currentLocationProvider.watchPosition().getOrThrow())
    }

    Function<Boolean>("hasLocationServicesEnabled") { ->
      hasLocationServicesEnabled()
    }

    Class("BackgroundLocation") {
      StaticFunction("ensureStarted") { taskName: String ->
        val locationTaskConsumer = currentLocationProvider.getLocationTaskConsumerClass().getOrNull()
          ?: return@StaticFunction false
        // TODO(@HubertBer): Add error and permission handling in here.
        // TODO(@HubertBer): Add options in here.
        taskManager.registerTask(taskName, locationTaskConsumer, emptyMap())
      }
      StaticFunction("stop") { taskName: String ->
        val locationTaskConsumer = currentLocationProvider.getLocationTaskConsumerClass().getOrNull()
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
        currentLocationProvider.enableLocationServices(appContext.throwingActivity, promptResult).getOrThrow()
        return@Coroutine promptResult.await()
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
      StaticAsyncFunction("ensureStarted") Coroutine { options: BackgroundSessionOptions ->
        if (LocationForegroundService.isBackgroundLocationUnthrottled()) {
          return@Coroutine
        }
        if (LocationForegroundService.updateForegroundServiceIfPromoted(mContext, options)) {
          return@Coroutine
        }
        if (!isForegrounded) {
          throw BackgroundSessionRequiresForegroundException()
        }

        val deferredPromotionResult = LocationForegroundService.preRequestServicePromotion()
        val serviceIntent = Intent(mContext, LocationForegroundService::class.java).apply {
          putExtras(options.toBundle())
        }
        mContext.startService(serviceIntent)
        val result = withTimeoutOrNull(4.milliseconds) { deferredPromotionResult.await() }
        when (result) {
          is ServicePromotionResult.Failed -> throw ServicePromotionFailedException(result.cause)
          ServicePromotionResult.Promoted -> {}
          null -> throw ServicePromotionTimedOutException()
        }
      }

      StaticFunction("stop") {
        mContext.stopService(Intent(mContext, LocationForegroundService::class.java))
      }

      StaticFunction("status") {
        LocationForegroundService.status()
      }
    }

    Class(PositionWatchHandle::class) {
      Constructor { ->
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

      Function("withInterval") { locationWatchHandle: PositionWatchHandle, intervalMs: Double ->
        val interval = if (!(0.0 <= intervalMs && intervalMs < Long.MAX_VALUE)) {
          0.0
        } else {
          intervalMs
        }
        locationWatchHandle.session.withInterval(interval.milliseconds)
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
      synchronized(sessionsLock) {
        for (session in watchSessions) {
          session.get()?.release()
        }
      }
    }

    OnActivityEntersForeground {
      isForegrounded = true
      synchronized(sessionsLock) {
        for (session in watchSessions) {
          session.get()?.onLifecycleChange(true)
        }
      }
    }

    OnActivityEntersBackground {
      isForegrounded = false
      synchronized(sessionsLock) {
        watchSessions.removeIf { it.get() == null }
        for (session in watchSessions) {
          session.get()?.onLifecycleChange(false)
        }
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

@OptimizedRecord
class BackgroundSessionOptions(
  @Field val notificationTitle: String? = null,
  @Field val notificationBody: String? = null,
  @Field val notificationColor: Int? = null,
  @Field val stopOnTaskRemoved: Boolean = false
) : Record {
  fun toBundle(): Bundle = Bundle().apply {
    putString(KEY_TITLE, notificationTitle)
    putString(KEY_BODY, notificationBody)
    notificationColor?.let { putInt(KEY_COLOR, it) }
    putBoolean(KEY_STOP_ON_TASK_REMOVED, stopOnTaskRemoved)
  }

  companion object {
    private const val KEY_TITLE = "notificationTitle"
    private const val KEY_BODY = "notificationBody"
    private const val KEY_COLOR = "notificationColor"
    private const val KEY_STOP_ON_TASK_REMOVED = "stopOnTaskRemoved"

    fun fromBundle(bundle: Bundle) = BackgroundSessionOptions(
      notificationTitle = bundle.getString(KEY_TITLE),
      notificationBody = bundle.getString(KEY_BODY),
      notificationColor = if (bundle.containsKey(KEY_COLOR)) bundle.getInt(KEY_COLOR) else null,
      stopOnTaskRemoved = bundle.getBoolean(KEY_STOP_ON_TASK_REMOVED)
    )
  }
}
