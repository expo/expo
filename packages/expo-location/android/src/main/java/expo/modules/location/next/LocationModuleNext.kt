package expo.modules.location.next

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.PersistableBundle
import androidx.annotation.RequiresApi
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.LocationBackgroundUnauthorizedException
import expo.modules.location.LocationUnauthorizedException
import expo.modules.location.NoPermissionInManifestException
import expo.modules.location.NoPermissionsModuleException
import expo.modules.location.TaskManagerNotFoundException
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.FallbackLocationProvider
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.records.PermissionRequestResponse
import expo.modules.location.taskConsumers.LocationTaskConsumer
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.io.Serializable
import java.lang.ref.WeakReference
import java.util.Locale
import java.util.concurrent.atomic.AtomicInteger
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

class RequestingBackgroundPermissionsWithoutForegroundGrantException: CodedException("Need to have foreground permissions granted, before asking for background permissions! Call requestForegroundPermissions() first and make sure the foreground location is granted.")
class BackgroundSessionRequiresForegroundException: CodedException("Need to be in foreground to ask for starting the background session.")
class ServicePromotionFailedException(cause: Throwable): CodedException(cause.localizedMessage, cause)
class ServicePromotionTimedOutException: CodedException("Service promotion has timed out, need to check the background activity status to check if the service actually promoted in a later time.")
class NoNotificationIconException: CodedException("No notification icon was configured.")
class LocationServicesPromptPendingException: CodedException("Tried running enableLocationServices while other is pending")

enum class LocationPermissionStatus(val value: String) : Enumerable {
  GRANTED("granted"),
  DENIED("denied"),
  UNDETERMINED("undetermined");

  companion object {
    fun fromString(status: String?): LocationPermissionStatus = when (status) {
      "granted" -> GRANTED
      "denied" -> DENIED
      else -> UNDETERMINED
    }
  }
}

enum class LocationScope(val value: String) : Enumerable {
  ALWAYS("ALWAYS"),
  WHEN_IN_USE("WHEN_IN_USE"),
  NOT_GRANTED("NOT_GRANTED")
}

enum class LocationAccuracy(val value: String) : Enumerable {
  FULL("FULL"),
  REDUCED("REDUCED"),
  NOT_GRANTED("NOT_GRANTED")
}

enum class LocationAccuracyOption(val value: String) : Enumerable {
  FULL("FULL"),
  REDUCED("REDUCED")
}

class RequestForegroundPermissionsOptions(
  @Field val accuracy: LocationAccuracyOption? = null
) : Record

class LocationPermissionResponse(
  @Field val status: LocationPermissionStatus,
  @Field val granted: Boolean,
  @Field val canAskAgain: Boolean,
  @Field val scope: LocationScope,
  @Field val accuracy: LocationAccuracy,
  @Field val expires: String = "never"
) : Record

enum class LocationProfile(val value: String): Enumerable {
  DEFAULT("DEFAULT"),
  AUTOMOTIVE_NAVIGATION("AUTOMOTIVE_NAVIGATION"),
  OTHER_NAVIGATION("OTHER_NAVIGATION"),
  FITNESS("FITNESS"),
  AIRBORNE("AIRBORNE"),
  LOW_POWER("LOW_POWER");

  fun priority(): LocationPriority {
    return when (this) {
      DEFAULT -> LocationPriority.BALANCED_POWER_ACCURACY
      AUTOMOTIVE_NAVIGATION -> LocationPriority.HIGH_ACCURACY
      OTHER_NAVIGATION -> LocationPriority.HIGH_ACCURACY
      FITNESS -> LocationPriority.HIGH_ACCURACY
      AIRBORNE -> LocationPriority.HIGH_ACCURACY
      LOW_POWER -> LocationPriority.LOW_POWER
    }
  }

  fun watchParameters(): WatchPositionParameters {
    return when (this) {
      DEFAULT -> WatchPositionParameters(LocationPriority.BALANCED_POWER_ACCURACY, 5.seconds, Duration.ZERO)
      AUTOMOTIVE_NAVIGATION -> WatchPositionParameters(LocationPriority.HIGH_ACCURACY, 1.seconds, Duration.ZERO)
      OTHER_NAVIGATION -> WatchPositionParameters(LocationPriority.HIGH_ACCURACY, 2.seconds, Duration.ZERO)
      FITNESS -> WatchPositionParameters(LocationPriority.HIGH_ACCURACY, 2.seconds, Duration.ZERO)
      AIRBORNE -> WatchPositionParameters(LocationPriority.HIGH_ACCURACY, 1.seconds, Duration.ZERO)
      LOW_POWER -> WatchPositionParameters(LocationPriority.LOW_POWER, 60.seconds, 300.seconds)
    }
  }
}

enum class LocationPriority {
  HIGH_ACCURACY,
  BALANCED_POWER_ACCURACY,
  LOW_POWER,
  PASSIVE,
}

data class WatchPositionParameters(
  val priority: LocationPriority,
  val interval: Duration,
  val maxUpdateDelay: Duration
)

data class GetCurrentPositionOptions(
  val maxCachedAge: Duration,
  val timeout: Duration,
  val priority: LocationPriority
)

class GetPositionOptions(
  @Field val maxCachedAge: Double? = null,
  @Field val timeout: Double? = null,
  @Field val profile: LocationProfile = LocationProfile.DEFAULT
) : Record {
  fun toProviderOptions(): GetCurrentPositionOptions = GetCurrentPositionOptions(
    maxCachedAge = (maxCachedAge ?: 0.0).seconds,
    timeout = (timeout ?: 90.0).seconds,
    priority = profile.priority()
  )
}

sealed interface LocationServicesContinuation {
  object Empty: LocationServicesContinuation
  object Pending: LocationServicesContinuation
  class Registered(val continuation: Continuation<Boolean>): LocationServicesContinuation
  object Resumed: LocationServicesContinuation
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

    Class ("LocationProvider") {
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

    Class ("BackgroundSession") {
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

    Class (PositionWatchHandle::class) {
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

    // Geofencing

    // permission helpers
  }

  private fun hasLocationServicesEnabled(): Boolean {
    return LocationManagerCompat.isLocationEnabled(locationManager)
  }

  // We want to request the ACCESS_BACKGROUND_LOCATION permission,
  // we need to check if it is in the manifest if so we ask for it,
  // but only if we need to do it separately.
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
    val foregroundCanAskAgain = coarsePermission.canAskAgain == true || finePermission.canAskAgain == true;

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


/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// STRUCTS ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

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

@OptimizedRecord
class Coordinates (
  @Field val latitude: Double,
  @Field val longitude: Double,
): Record, Serializable {
  fun toPersistableBundle(): PersistableBundle {
    val bundle = PersistableBundle()
    bundle.putDouble("lat", latitude)
    bundle.putDouble("lon", longitude)
    return bundle
  }

  fun toBundle(): Bundle {
    val bundle = Bundle()
    bundle.putDouble("latitude", latitude)
    bundle.putDouble("longitude", longitude)
    return bundle
  }
}

fun PersistableBundle.toCoordinates(): Coordinates = Coordinates(
  getDouble("lat"),
  getDouble("lon"),
)

@OptimizedRecord
class Position (
  @Field val coordinates: Coordinates,
  @Field val timestamp: Double,

  @Field val mslAltitude: Double? = null,
  @Field val ellipsoidalAltitude: Double? = null,
  @Field val speed: Double? = null,

  @Field val horizontalAccuracy: Double? = null,
  @Field val verticalAccuracy: Double? = null,
  @Field val speedAccuracy: Double? = null,
): Record, Serializable {
  fun toPersistableBundle(): PersistableBundle {
    val bundle = PersistableBundle()
    bundle.putPersistableBundle("coordinates", coordinates.toPersistableBundle())
    bundle.putDouble("time", timestamp)
    // Optional fields are omitted rather than written as null — PersistableBundle has no null
    // primitives, and getDouble's default cannot be told apart from a stored value.
    mslAltitude?.let { bundle.putDouble("mslAltitude", it) }
    ellipsoidalAltitude?.let { bundle.putDouble("ellipsoidalAltitude", it) }
    speed?.let { bundle.putDouble("speed", it) }
    horizontalAccuracy?.let { bundle.putDouble("horizontalAccuracy", it) }
    verticalAccuracy?.let { bundle.putDouble("verticalAccuracy", it) }
    speedAccuracy?.let { bundle.putDouble("speedAccuracy", it) }
    return bundle
  }

  fun toBundle(): Bundle {
    val bundle = Bundle()
    bundle.putBundle("coordinates", coordinates.toBundle())
    bundle.putDouble("timestamp", timestamp)
    mslAltitude?.let { bundle.putDouble("mslAltitude", it) }
    ellipsoidalAltitude?.let { bundle.putDouble("ellipsoidalAltitude", it) }
    speed?.let { bundle.putDouble("speed", it) }
    horizontalAccuracy?.let { bundle.putDouble("horizontalAccuracy", it) }
    verticalAccuracy?.let { bundle.putDouble("verticalAccuracy", it) }
    speedAccuracy?.let { bundle.putDouble("speedAccuracy", it) }
    return bundle
  }
}

private fun PersistableBundle.getDoubleOrNull(key: String): Double? =
  if (containsKey(key)) getDouble(key) else null

fun PersistableBundle.toPosition(): Position = Position(
  coordinates = getPersistableBundle("coordinates")?.toCoordinates() ?: Coordinates(0.0, 0.0),
  timestamp = getDouble("time"),
  mslAltitude = getDoubleOrNull("mslAltitude"),
  ellipsoidalAltitude = getDoubleOrNull("ellipsoidalAltitude"),
  speed = getDoubleOrNull("speed"),
  horizontalAccuracy = getDoubleOrNull("horizontalAccuracy"),
  verticalAccuracy = getDoubleOrNull("verticalAccuracy"),
  speedAccuracy = getDoubleOrNull("speedAccuracy"),
)


/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Permissions helpers ///////////////////////////
/////////////////////////////////////////////////////////////////////////////////

internal class PermissionsPromise(private val continuation: Continuation<PermissionRequestResponse>): Promise {
  override fun resolve(value: Any?) {
    val result = value as? Bundle
      ?: throw ConversionException(Any::class.java, Bundle::class.java, "value to which permission promise resolved is not a bundle")

    continuation.resume(PermissionRequestResponse(result))
  }

  override fun reject(code: String?, message: String?, cause: Throwable?) {
    continuation.resumeWithException(CodedException(code, message, cause))
  }
}

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

class WatchParametersStatus(
  @Field val priority: String = "",
  @Field val intervalSeconds: Double = 0.0,
  @Field val maxUpdateDelaySeconds: Double = 0.0
) : Record

class PositionChangedEvent(
  @Field val data: Position? = null,
  @Field val error: String? = null
) : Record

class PositionWatchStatus(
  @Field val isWatching: Boolean = false,
  @Field val isPaused: Boolean = false,
  // Whether the session currently holds a platform subscription. False also while the app is
  // backgrounded or before the first positionChanged listener is added.
  @Field val isSubscribed: Boolean = false,
  @Field val activeParameters: WatchParametersStatus = WatchParametersStatus(),
  @Field val stagedParameters: WatchParametersStatus = WatchParametersStatus()
) : Record

fun WatchPositionParameters.toStatus(): WatchParametersStatus {
  return WatchParametersStatus(
    priority = priority.name,
    intervalSeconds = interval.inWholeMilliseconds / 1000.0,
    maxUpdateDelaySeconds = maxUpdateDelay.inWholeMilliseconds / 1000.0
  )
}

interface WatchSession {
  fun startUpdates(parameters: WatchPositionParameters, onPosition: (Position) -> Unit): Boolean
  fun stopUpdates()
}

class PausableWatchSession(
  initialParameters: WatchPositionParameters,
  private val session: WatchSession
) {

  var activeParameters: WatchPositionParameters = initialParameters
    private set
  var stagedParameters: WatchPositionParameters = initialParameters
    private set

  @Volatile
  var lastPosition: Position? = null

  var isPaused: Boolean = false
  var isStarted: Boolean = false
  var isReleased: Boolean = false
  var isSubscribed: Boolean = false
  var isInForeground: Boolean = true

  private var onPosition: ((Position) -> Unit)? = null

  private fun isInForegroundOrHasForegroundService(): Boolean {
    return isInForeground || LocationForegroundService.isBackgroundLocationUnthrottled()
  }

  @SuppressLint("MissingPermission")
  @Synchronized
  private fun handleLocationUpdatesRequest(): Boolean {
    val shouldRequestUpdates = !isSubscribed && !isPaused && isStarted && !isReleased && isInForegroundOrHasForegroundService()
    val shouldRemoveRequest =  isSubscribed && (isPaused || !isStarted || isReleased || !isInForegroundOrHasForegroundService())
    val onPosition = this.onPosition
    if (shouldRequestUpdates && onPosition != null) {
      isSubscribed = session.startUpdates(activeParameters, onPosition)
      return isSubscribed
    }
    if (shouldRemoveRequest) {
      session.stopUpdates()
      isSubscribed = false
    }
    return true
  }

  @Synchronized
  fun withProfile(profile: LocationProfile) {
    stagedParameters = profile.watchParameters()
  }

  @Synchronized
  fun withInterval(interval: Duration) {
    stagedParameters = stagedParameters.copy(interval = interval)
  }

  @Synchronized
  fun withBatching(maxUpdateDelay: Duration) {
    stagedParameters = stagedParameters.copy(maxUpdateDelay = maxUpdateDelay)
  }

  @Synchronized
  fun restart(): Boolean {
    val needsResubscribe = !isSubscribed && isStarted && !isPaused && !isReleased && isInForegroundOrHasForegroundService()
    if (stagedParameters == activeParameters && !needsResubscribe) {
      return true
    }
    activeParameters = stagedParameters
    val onPosition = this.onPosition
    if (isSubscribed && onPosition != null) {
      // Atomic reconfiguration: one remove + one request with the new parameters.
      session.stopUpdates()
      isSubscribed = session.startUpdates(activeParameters, onPosition)
      return isSubscribed
    }
    return handleLocationUpdatesRequest()
  }

  @Synchronized
  fun onLifecycleChange(isInForeground: Boolean) {
    this.isInForeground = isInForeground
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun start(onPosition: (Position) -> Unit) {
    isStarted = true
    this.onPosition = { position ->
      lastPosition = position
      onPosition(position)
    }
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun stop() {
    isStarted = false
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun pause() {
    isPaused = true
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun resume(): Boolean {
    isPaused = false
    return handleLocationUpdatesRequest()
  }

  @Synchronized
  fun release() {
    isReleased = true
    handleLocationUpdatesRequest()
  }

  fun getLastKnownPosition(): Position? {
    return lastPosition
  }

  @Synchronized
  fun status(): PositionWatchStatus {
    return PositionWatchStatus(
      isWatching = isStarted && !isReleased,
      isPaused = isPaused,
      isSubscribed = isSubscribed,
      activeParameters = activeParameters.toStatus(),
      stagedParameters = stagedParameters.toStatus()
    )
  }
}


/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// SHARED OBJECTS ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

class PositionWatchHandle(
  val session: PausableWatchSession
): SharedObject() {

  override fun onStartListeningToEvent(eventName: String) {
    if (eventName == POSITION_CHANGED) {
      session.start { position -> emit(POSITION_CHANGED, PositionChangedEvent(data = position)) }
    }
  }

  override fun onStopListeningToEvent(eventName: String) {
    if (eventName == POSITION_CHANGED) {
      session.stop()
    }
  }

  override fun sharedObjectDidRelease() {
    session.release()
  }
}

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// LocationProvider //////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

// ProviderResult
sealed interface ProviderResult<out T> {
  data class Success<T>(val value: T): ProviderResult<T>
  object Unavailable: ProviderResult<Nothing>
  object Unsupported: ProviderResult<Nothing>

  fun getOrThrow(): T = when (this) {
    is Success -> value
    Unavailable -> throw LocationUnavailableException()
    Unsupported -> throw LocationOperationNotSupportedException()
  }

  fun getOrNull(): T? = when (this) {
    is Success -> value
    Unavailable -> null
    Unsupported -> throw LocationOperationNotSupportedException()
  }
}


interface LocationProvider {
  suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position>
  fun watchPosition(): ProviderResult<WatchSession>
  fun name(): String

  // Prompt user to enable location services.
  // This function assumes that the location services are turned off, hence there is no reason to perform a check for it.
  suspend fun enableLocationServices(activity: Activity, storeContinuationObject: (Continuation<Boolean>) -> Unit): ProviderResult<Boolean> = ProviderResult.Unsupported

  // This class must have (Context, TaskManagerUtilsInterface?) constructor as it will be constructed like this by TaskManager.
  fun getLocationTaskConsumerClass(): ProviderResult<Class<out TaskConsumer>> = ProviderResult.Unsupported
}

class LocationWatchHandleCreationException: CodedException("LocationWatchHandle cannot be created from JavaScript!")
class LocationUnavailableException: CodedException("Location fix is currently unavailable")
class LocationOperationNotSupportedException: CodedException("This location operation is not supported")

internal class ConversionException(fromClass: Class<*>, toClass: Class<*>, message: String? = "") :
  CodedException("Couldn't cast from ${fromClass::class.simpleName} to ${toClass::class.java.simpleName}: $message")

fun Location.mslAltitude(): Double? {
  return if (Build.VERSION.SDK_INT >= 34 && hasMslAltitude()) {
    mslAltitudeMeters
  } else null
}

fun Location.verticalAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasVerticalAccuracy()) {
    verticalAccuracyMeters.toDouble()
  } else null
}

fun Location.speedAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasSpeedAccuracy()) {
    speedAccuracyMetersPerSecond.toDouble()
  } else null
}

fun Location.toPosition(): Position {
  return Position(
    coordinates = Coordinates(
      latitude,
      longitude
    ),
    timestamp = time.toDouble(),
    mslAltitude = mslAltitude(),
    ellipsoidalAltitude = if (hasAltitude()) altitude else null,
    speed= if (hasSpeed()) speed.toDouble() else null,

    horizontalAccuracy = if (this.hasAccuracy()) this.accuracy.toDouble() else null,
    verticalAccuracy = verticalAccuracy(),
    speedAccuracy = speedAccuracy(),
  )
}
