package expo.modules.location.next.locationProviders

import android.app.Activity
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

interface LocationProvider {
  suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position>
  fun name(): String

  // Prompt user to enable location services.
  // The caller guarantees the location services are turned off, so there is no reason to check the
  // master toggle again. An implementation may still check whether the settings satisfy its own request.
  suspend fun enableLocationServices(activity: Activity, storeContinuationObject: (Continuation<Boolean>) -> Unit): ProviderResult<Boolean> = ProviderResult.Unsupported
}

class LocationUnavailableException : CodedException("Location fix is currently unavailable")
class LocationOperationNotSupportedException : CodedException("This location operation is not supported")
