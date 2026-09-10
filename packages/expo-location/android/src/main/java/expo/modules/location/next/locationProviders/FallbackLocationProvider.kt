package expo.modules.location.next.locationProviders

import android.app.Activity
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.location.next.Position
import kotlinx.coroutines.CompletableDeferred

class FallbackLocationProvider(val locationProviders: List<LocationProvider>) : LocationProvider {
  override fun name(): String {
    return locationProviders
      .joinToString(prefix = "Fallback: ", separator = " -> ") {
        it.name()
      }
  }

  override suspend fun getPosition(options: GetCurrentPositionOptions): ProviderResult<Position> {
    return firstAvailable { it.getPosition(options) }
  }

  override suspend fun enableLocationServices(activity: Activity, promptResult: CompletableDeferred<Boolean>): ProviderResult<Unit> {
    return firstAvailable { it.enableLocationServices(activity, promptResult) }
  }

  override fun watchPosition(): ProviderResult<WatchSession> {
    return firstAvailable { it.watchPosition() }
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
