package expo.modules.location.next.locationProviders

import android.app.Activity
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.exception.CodedException
import expo.modules.location.next.LocationProfile
import expo.modules.location.next.Position
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds

enum class LocationPriority {
  HIGH_ACCURACY,
  BALANCED_POWER_ACCURACY,
  LOW_POWER,
  PASSIVE
}

data class WatchPositionParameters(
  val priority: LocationPriority,
  val interval: Duration,
  val maxUpdateDelay: Duration
)

data class BackgroundUpdatesParameters(
  val priority: LocationPriority,
  val interval: Duration,
  val maxUpdateDelay: Duration,
  val minUpdateDistance: Float
) {
  fun toMap(): Map<String, Any> = mapOf(
    KEY_PRIORITY to priority.name,
    KEY_INTERVAL to interval.inWholeMilliseconds.toInt(),
    KEY_MAX_UPDATE_DELAY to maxUpdateDelay.inWholeMilliseconds.toInt(),
    KEY_MIN_UPDATE_DISTANCE to minUpdateDistance.toDouble()
  )

  companion object {
    const val KEY_PRIORITY = "priority"
    const val KEY_INTERVAL = "interval"
    const val KEY_MAX_UPDATE_DELAY = "maxUpdateDelay"
    const val KEY_MIN_UPDATE_DISTANCE = "minUpdateDistance"
  }
}

fun Map<String, Any?>.toBackgroundUpdatesParameters(): BackgroundUpdatesParameters {
  val fallback = LocationProfile.DEFAULT.toBackgroundUpdatesParameters()

  val priority = (this[BackgroundUpdatesParameters.KEY_PRIORITY] as? String)
    ?.let { name -> LocationPriority.entries.firstOrNull { it.name == name } }
    ?: fallback.priority

  return BackgroundUpdatesParameters(
    priority = priority,
    interval = (this[BackgroundUpdatesParameters.KEY_INTERVAL] as? Number)?.toLong()?.milliseconds
      ?: fallback.interval,
    maxUpdateDelay = (this[BackgroundUpdatesParameters.KEY_MAX_UPDATE_DELAY] as? Number)?.toLong()?.milliseconds
      ?: fallback.maxUpdateDelay,
    minUpdateDistance = (this[BackgroundUpdatesParameters.KEY_MIN_UPDATE_DISTANCE] as? Number)?.toFloat()
      ?: fallback.minUpdateDistance
  )
}

sealed interface WatchUpdate {
  data class Fix(val position: Position) : WatchUpdate
  data class Failure(val cause: Throwable) : WatchUpdate
}

data class GetCurrentPositionOptions(
  val maxCachedAge: Duration,
  val timeout: Duration,
  val priority: LocationPriority
)

sealed interface ProviderResult<out T> {
  data class Available<T>(val value: T) : ProviderResult<T>
  object Unavailable : ProviderResult<Nothing>
  object Unsupported : ProviderResult<Nothing>

  fun getOrThrow(operationName: String): T = when (this) {
    is Available -> value
    Unavailable -> throw OperationUnavailableException(operationName)
    Unsupported -> throw LocationOperationUnsupportedException(operationName)
  }

  fun getOrNull(operationName: String): T? = when (this) {
    is Available -> value
    Unavailable -> null
    Unsupported -> throw LocationOperationUnsupportedException(operationName)
  }
}

sealed interface EnableLocationServicesResult {
  object Enabled : EnableLocationServicesResult
  object Disabled : EnableLocationServicesResult
  object ResolutionPending : EnableLocationServicesResult
}

interface PositionUpdatesSession {
  fun startUpdates(parameters: WatchPositionParameters, onUpdate: (WatchUpdate) -> Unit): Boolean
  fun stopUpdates()
  fun isSubscribed(): Boolean
  fun canDeliverUpdates(): Boolean
}

interface LocationProvider {
  val name: String
  suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position>
  fun watchPosition(): ProviderResult<PositionUpdatesSession>

  // Prompt user to enable location services.
  // The caller guarantees the location services are turned off, so there is no reason to check the
  // master toggle again. An implementation may still check whether the settings satisfy its own request.
  //
  // When returning EnableLocationServicesResult.ResolutionPending this call has to result in OnActivityResult
  // being called with payload.requestCode == SETTINGS_REQUEST_CODE
  suspend fun enableLocationServices(activity: Activity): ProviderResult<EnableLocationServicesResult> = ProviderResult.Unsupported

  // This class must have (Context, TaskManagerUtilsInterface?) constructor as it will be constructed like this by TaskManager.
  fun getLocationTaskConsumerClass(): ProviderResult<Class<out TaskConsumer>> = ProviderResult.Unsupported

  fun getRegisteredTaskConsumerClass(taskManager: TaskManagerInterface, taskName: String): ProviderResult<Class<out TaskConsumer>> = ProviderResult.Unsupported
}

class OperationUnavailableException(functionName: String) : CodedException("$functionName is currently unavailable")
class LocationOperationUnsupportedException(functionName: String) : CodedException("$functionName operation is unsupported")
