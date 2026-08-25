package expo.modules.location.next.locationProviders

import android.app.Activity
import expo.modules.location.next.LocationProvider
import expo.modules.location.next.PositionWatchHandle
import expo.modules.location.next.Position
import expo.modules.location.next.ProviderResult
import kotlin.coroutines.Continuation

class FallbackLocationProvider(val locationProviders: List<LocationProvider>): LocationProvider {
  val fallbackName: String by lazy {
    var sb = StringBuilder("Fallback: ")
    for (lp in locationProviders) {
      sb.append(lp.name())
      sb.append(" -> ")
    }
    sb.toString()
  }

  override fun name(): String {
    return fallbackName
  }

  override suspend fun getCurrentPosition(): ProviderResult<Position> {
    var outcome: ProviderResult<Position> = ProviderResult.Unsupported
    for (locationProvider in locationProviders) {
      val position = locationProvider.getCurrentPosition()
      when (position) {
        is ProviderResult.Success -> return position
        ProviderResult.Unavailable -> outcome = ProviderResult.Unavailable
        // Note that the operation is only unsupported if it is unsupported for all of the providers
        ProviderResult.Unsupported -> continue
      }
    }
    return outcome
  }

  override fun watchPosition(): ProviderResult<PositionWatchHandle> {
    var outcome: ProviderResult<PositionWatchHandle> = ProviderResult.Unsupported
    for (locationProvider in locationProviders) {
      val watchHandle = locationProvider.watchPosition()
      when (watchHandle) {
        is ProviderResult.Success -> return watchHandle
        ProviderResult.Unavailable -> outcome = ProviderResult.Unavailable
        // Note that the operation is only unsupported if it is unsupported for all of the providers
        ProviderResult.Unsupported -> continue
      }
    }
    return outcome
  }

  override suspend fun getLastKnownPosition(): Position? {
    return locationProviders.firstNotNullOfOrNull { it.getLastKnownPosition() }
  }

  override suspend fun enableLocationServices(activity: Activity, storeContinuationObject: (Continuation<Boolean>) -> Unit): ProviderResult<Boolean> {
    return ProviderResult.Unavailable
  }
}