package expo.modules.location.next

import android.Manifest
import android.content.Context
import android.content.Intent
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.LocationBackgroundUnauthorizedException
import expo.modules.location.LocationUnauthorizedException
import expo.modules.location.NoPermissionInManifestException
import expo.modules.location.NoPermissionsModuleException
import expo.modules.location.TaskManagerNotFoundException
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.FallbackLocationProvider
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.next.locationProviders.LocationProvider
import expo.modules.location.next.locationProviders.WatchPositionParameters
import expo.modules.location.next.locationProviders.WatchSession
import expo.modules.location.records.PermissionRequestResponse
import kotlinx.coroutines.withTimeoutOrNull
import java.lang.ref.WeakReference
import java.util.Locale
import java.util.concurrent.atomic.AtomicInteger
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlin.time.Duration.Companion.seconds

class RequestingBackgroundPermissionsWithoutForegroundGrantException : CodedException("Need to have foreground permissions granted, before asking for background permissions! Call requestForegroundPermissions() first and make sure the foreground location is granted.")
class BackgroundSessionRequiresForegroundException : CodedException("Need to be in foreground to ask for starting the background session.")
class ServicePromotionFailedException(cause: Throwable) : CodedException(cause.localizedMessage, cause)
class ServicePromotionTimedOutException : CodedException("Service promotion has timed out, need to check the background activity status to check if the service actually promoted in a later time.")
class NoNotificationIconException : CodedException("No notification icon was configured.")
class LocationServicesPromptPendingException : CodedException("Tried running enableLocationServices while other is pending")

sealed interface LocationServicesContinuation {
  object Empty : LocationServicesContinuation
  object Pending : LocationServicesContinuation
  class Registered(val continuation: Continuation<Boolean>) : LocationServicesContinuation
  object Resumed : LocationServicesContinuation
}

class LocationModuleNext : Module() {
  lateinit var mContext: Context
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
  var locationServicesPromptContinuation: LocationServicesContinuation = LocationServicesContinuation.Empty
  var isForegrounded = false

  fun createPositionWatchHandle(initialParameters: WatchPositionParameters, session: WatchSession): PositionWatchHandle = synchronized(sessionsLock) {
    val pausableSession = PausableWatchSession(initialParameters, session)
    watchSessions.add(WeakReference(pausableSession))
    return@synchronized PositionWatchHandle(pausableSession)
  }

  override fun definition() = ModuleDefinition {
    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      currentLocationProvider = fusedLocationProviderInstance.ref
      locationManager = mContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
      modulesStarted.incrementAndGet()
    }

    // Permissions
    AsyncFunction("requestForegroundPermissions") Coroutine { options: RequestForegroundPermissionsOptions? ->
      requestForegroundPermissions(options)
      return@Coroutine getLocationPermissions(background = false)
    }

    AsyncFunction("getForegroundPermissions") Coroutine { ->
      return@Coroutine getLocationPermissions(background = false)
    }

    AsyncFunction("requestBackgroundPermissions") Coroutine { ->
      requestBackgroundPermissions()
      return@Coroutine getLocationPermissions(background = true)
    }

    AsyncFunction("getBackgroundPermissions") Coroutine { ->
      return@Coroutine getLocationPermissions(background = true)
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
      ensureForegroundPermissions()
      val providerOptions = (options ?: GetPositionOptions()).toProviderOptions()
      return@Coroutine currentLocationProvider.getPosition(providerOptions).getOrNull()
    }

    Function("watchPosition") { profile: LocationProfile? ->
      ensureForegroundPermissions()
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
      if (locationServicesPromptContinuation !is LocationServicesContinuation.Empty) {
        throw LocationServicesPromptPendingException()
      }
      locationServicesPromptContinuation = LocationServicesContinuation.Pending
      try {
        return@Coroutine currentLocationProvider.enableLocationServices(appContext.throwingActivity) { continuation ->
          locationServicesPromptContinuation = LocationServicesContinuation.Registered(continuation)
        }.getOrThrow()
      } finally {
        locationServicesPromptContinuation = LocationServicesContinuation.Empty
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode == SETTINGS_REQUEST_CODE) {
        if (locationServicesPromptContinuation is LocationServicesContinuation.Registered) {
          val continuation = (locationServicesPromptContinuation as LocationServicesContinuation.Registered).continuation
          locationServicesPromptContinuation = LocationServicesContinuation.Resumed
          continuation.resume(hasLocationServicesEnabled())
        }
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
        val result = withTimeoutOrNull(4.seconds.inWholeMilliseconds) { deferredPromotionResult.await() }
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
        throw LocationWatchHandleCreationException()
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

      Function("withInterval") { locationWatchHandle: PositionWatchHandle, intervalSeconds: Double ->
        locationWatchHandle.session.withInterval(intervalSeconds.seconds)
        locationWatchHandle
      }

      Function("withBatching") { locationWatchHandle: PositionWatchHandle, maxUpdateDelaySeconds: Double ->
        locationWatchHandle.session.withBatching(maxUpdateDelaySeconds.seconds)
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

  private suspend fun requestBackgroundPermissions() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      // Before version Q, there are only foreground permissions.
      return
    }
    if (!isBackgroundPermissionInManifest()) {
      throw NoPermissionInManifestException("ACCESS_BACKGROUND_LOCATION")
    }

    val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()
    val coarsePermission = getPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_COARSE_LOCATION)
    val finePermission = getPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_FINE_LOCATION)
    if (!finePermission.granted && !coarsePermission.granted) {
      throw RequestingBackgroundPermissionsWithoutForegroundGrantException()
    }
    askForPermissionsWithPermissionsManager(
      permissionsManager,
      Manifest.permission.ACCESS_BACKGROUND_LOCATION
    )
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  private fun isBackgroundPermissionInManifest(): Boolean {
    appContext.permissions?.let {
      return it.isPermissionPresentInManifest(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    }
    throw NoPermissionsModuleException()
  }

  suspend fun requestForegroundPermissions(options: RequestForegroundPermissionsOptions?) {
    val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()
    val accuracy = options?.accuracy ?: LocationAccuracyOption.FULL

    when (accuracy) {
      LocationAccuracyOption.FULL -> askForPermissionsWithPermissionsManager(
        permissionsManager,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.ACCESS_FINE_LOCATION
      )
      LocationAccuracyOption.REDUCED -> askForPermissionsWithPermissionsManager(
        permissionsManager,
        Manifest.permission.ACCESS_COARSE_LOCATION
      )
    }
  }

  fun isBackgroundLocationPermissionGranted(permissions: Permissions): Boolean {
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
      permissions.hasGrantedPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
  }

  internal suspend fun getLocationPermissions(background: Boolean): LocationPermissionResponse {
    val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()
    val coarsePermission = getPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_COARSE_LOCATION)
    val finePermission = getPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_FINE_LOCATION)
    val foregroundStatus = when {
      coarsePermission.status == "granted" || finePermission.status == "granted" -> "granted"
      coarsePermission.status == "denied" || finePermission.status == "denied"-> "denied"
      else -> null
    }
    val foregroundGranted = foregroundStatus == "granted"
    val accuracy = when {
      finePermission.granted -> LocationAccuracy.FULL
      coarsePermission.granted -> LocationAccuracy.REDUCED
      else -> LocationAccuracy.NOT_GRANTED
    }
    val foregroundCanAskAgain = coarsePermission.canAskAgain == true || finePermission.canAskAgain == true

    val backgroundPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
      getPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
      else PermissionRequestResponse(
        granted = foregroundGranted,
        status = foregroundStatus,
        canAskAgain = foregroundCanAskAgain,
        expires = "never",
        android = null
      )

    val scope = when {
      backgroundPermission.granted -> LocationScope.ALWAYS
      foregroundGranted -> LocationScope.WHEN_IN_USE
      else -> LocationScope.NOT_GRANTED
    }
    val granted: Boolean = foregroundGranted && if (background) {
      isBackgroundLocationPermissionGranted(permissionsManager)
    } else true
    val status = LocationPermissionStatus.fromString(
      if (background) backgroundPermission.status
      else foregroundStatus
    )
    val canAskAgain: Boolean =
      if (background) backgroundPermission.canAskAgain ?: true
      else foregroundCanAskAgain
    return LocationPermissionResponse(
      status,
      granted,
      canAskAgain,
      scope,
      accuracy,
      expires = "never"
    )
  }

  private fun ensureForegroundPermissions() {
    val permissions = appContext.permissions ?: throw NoPermissionsModuleException()
    val hasFine = permissions.hasGrantedPermissions(Manifest.permission.ACCESS_FINE_LOCATION)
    val hasCoarse = permissions.hasGrantedPermissions(Manifest.permission.ACCESS_COARSE_LOCATION)
    if (!hasFine && !hasCoarse) {
      throw LocationUnauthorizedException()
    }
  }

  private fun ensureBackgroundPermissions() {
    ensureForegroundPermissions()
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      // Before version Q there were no separate background permissions.
      return
    }
    val permissions = appContext.permissions ?: throw NoPermissionsModuleException()
    if (!permissions.hasGrantedPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION)) {
      throw LocationBackgroundUnauthorizedException()
    }
  }

  fun geocode(position: Position) {
    val geocoder = android.location.Geocoder(mContext, Locale.getDefault())
    geocoder.getFromLocation(position.coordinates.latitude, position.coordinates.longitude, 1)
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

internal class PermissionsPromise(private val continuation: Continuation<PermissionRequestResponse>) : Promise {
  override fun resolve(value: Any?) {
    val result = value as? Bundle
      ?: throw ConversionException(Any::class.java, Bundle::class.java, "value to which permission promise resolved is not a bundle")

    continuation.resume(PermissionRequestResponse(result))
  }

  override fun reject(code: String?, message: String?, cause: Throwable?) {
    continuation.resumeWithException(CodedException(code, message, cause))
  }
}

internal class ConversionException(fromClass: Class<*>, toClass: Class<*>, message: String? = "") :
  CodedException("Couldn't cast from ${fromClass::class.simpleName} to ${toClass::class.java.simpleName}: $message")

internal suspend fun askForPermissionsWithPermissionsManager(permissionsManager: Permissions, vararg permissionStrings: String): PermissionRequestResponse {
  return suspendCoroutine { continuation ->
    Permissions.askForPermissionsWithPermissionsManager(
      permissionsManager,
      PermissionsPromise(continuation),
      *permissionStrings
    )
  }
}

internal suspend fun getPermissionsWithPermissionsManager(permissionManager: Permissions, vararg permissionStrings: String): PermissionRequestResponse {
  return suspendCoroutine { continuation ->
    Permissions.getPermissionsWithPermissionsManager(
      permissionManager,
      PermissionsPromise(continuation),
      *permissionStrings
    )
  }
}
