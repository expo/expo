package expo.modules.location.next.locationProviders

import android.app.Activity
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.kotlin.exception.CodedException
import expo.modules.location.next.Position
import kotlin.coroutines.Continuation
import kotlin.time.Duration

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

sealed interface ProviderResult<out T> {
  data class Success<T>(val value: T) : ProviderResult<T>
  object Unavailable : ProviderResult<Nothing>
  object Unsupported : ProviderResult<Nothing>

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

interface WatchSession {
  fun startUpdates(parameters: WatchPositionParameters, onPosition: (Position) -> Unit): Boolean
  fun stopUpdates()
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

class LocationUnavailableException : CodedException("Location fix is currently unavailable")
class LocationOperationNotSupportedException : CodedException("This location operation is not supported")
