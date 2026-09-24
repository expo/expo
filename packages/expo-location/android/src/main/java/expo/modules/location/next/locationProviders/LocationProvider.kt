package expo.modules.location.next.locationProviders

import android.app.Activity
import expo.modules.kotlin.exception.CodedException
import expo.modules.location.next.Position
import kotlin.time.Duration

enum class LocationPriority {
  HIGH_ACCURACY,
  BALANCED_POWER_ACCURACY,
  LOW_POWER,
  PASSIVE
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

  fun getOrThrow(operationName: String): T = when (this) {
    is Success -> value
    Unavailable -> throw OperationUnavailableException(operationName)
    Unsupported -> throw LocationOperationUnsupportedException(operationName)
  }

  fun getOrNull(operationName: String): T? = when (this) {
    is Success -> value
    Unavailable -> null
    Unsupported -> throw LocationOperationUnsupportedException(operationName)
  }
}

sealed interface EnableLocationServicesResult {
  object Enabled : EnableLocationServicesResult
  object Disabled : EnableLocationServicesResult
  object ResolutionPending : EnableLocationServicesResult
}

interface LocationProvider {
  suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position>
  val name: String

  // Prompt user to enable location services.
  // The caller guarantees the location services are turned off, so there is no reason to check the
  // master toggle again. An implementation may still check whether the settings satisfy its own request.
  //
  // When returning EnableLocationServicesResult.ResolutionPending this call has to result in OnActivityResult
  // being called with payload.requestCode == SETTINGS_REQUEST_CODE
  suspend fun enableLocationServices(activity: Activity): ProviderResult<EnableLocationServicesResult> = ProviderResult.Unsupported
}

class OperationUnavailableException(functionName: String) : CodedException("$functionName is currently unavailable")
class LocationOperationUnsupportedException(functionName: String) : CodedException("$functionName operation is unsupported")
