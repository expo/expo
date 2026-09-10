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


class BackgroundSessionRequiresForegroundException : CodedException("Need to be in foreground to ask for starting the background session.")
class ServicePromotionFailedException(cause: Throwable) : CodedException(cause.localizedMessage, cause)
class ServicePromotionTimedOutException : CodedException("Service promotion has timed out, need to check the background activity status to check if the service actually promoted in a later time.")
class NoNotificationIconException : CodedException("No notification icon was configured.")
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
  var isForegrounded = false

  fun createPositionWatchHandle(initialParameters: WatchPositionParameters, session: PositionUpdatesSession): PositionWatchHandle = synchronized(watchSessions) {
    val pausableSession = PausableWatchSession(initialParameters, session)
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
      StaticAsyncFunction("ensureStarted") Coroutine { options: BackgroundSessionOptions ->
        if (LocationForegroundService.isBackgroundLocationUnthrottled()) {
          return@Coroutine
        }
        if (LocationForegroundService.updateForegroundServiceIfPromoted(context, options)) {
          return@Coroutine
        }
        if (!isForegrounded) {
          throw BackgroundSessionRequiresForegroundException()
        }

        val deferredPromotionResult = LocationForegroundService.preRequestServicePromotion()
        val serviceIntent = Intent(context, LocationForegroundService::class.java).apply {
          putExtras(options.toBundle())
        }
        context.startService(serviceIntent)
        val result = withTimeoutOrNull(4.seconds) { deferredPromotionResult.await() }
        when (result) {
          is ServicePromotionResult.Failed -> throw ServicePromotionFailedException(result.cause)
          ServicePromotionResult.Promoted -> {}
          null -> throw ServicePromotionTimedOutException()
        }
      }

      StaticFunction("stop") {
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
      synchronized(watchSessions) {
        for (session in watchSessions) {
          session.get()?.release()
        }
      }
    }

    OnActivityEntersForeground {
      isForegrounded = true
      synchronized(watchSessions) {
        for (session in watchSessions) {
          session.get()?.onLifecycleChange(true)
        }
      }
    }

    OnActivityEntersBackground {
      isForegrounded = false
      synchronized(watchSessions) {
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
