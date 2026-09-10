package expo.modules.location.next.locationProviders

import android.app.Activity
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.location.next.Position
import kotlin.coroutines.Continuation

class FallbackLocationProvider(val locationProviders: List<LocationProvider>) : LocationProvider {
  val fallbackName: String by lazy {
    locationProviders.joinToString(prefix = "Fallback: ", separator = " -> ") { it.name() }
  }

  override fun name(): String {
    return fallbackName
  }

  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    return firstAvailable { it.getPosition(options) }
  }

  override fun watchPosition(): ProviderResult<WatchSession> {
    return firstAvailable { it.watchPosition() }
  }

  override suspend fun enableLocationServices(activity: Activity, storeContinuationObject: (Continuation<Boolean>) -> Unit): ProviderResult<Boolean> {
    return firstAvailable { it.enableLocationServices(activity, storeContinuationObject) }
  }

  override fun getLocationTaskConsumerClass(): ProviderResult<Class<out TaskConsumer>> {
    return firstAvailable { it.getLocationTaskConsumerClass() }
  }

  inline fun <T> firstAvailable(providerOperation: (LocationProvider) -> ProviderResult<T>): ProviderResult<T> {
    var outcome: ProviderResult<T> = ProviderResult.Unsupported
    for (locationProvider in locationProviders) {
      val thisOutcome = providerOperation(locationProvider)
      when (thisOutcome) {
        is ProviderResult.Success -> return thisOutcome
        ProviderResult.Unavailable -> outcome = ProviderResult.Unavailable
        // Note that the operation is only unsupported if it is unsupported for all of the providers
        ProviderResult.Unsupported -> continue
      }
    }
    return outcome
  }
}