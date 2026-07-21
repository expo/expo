package expo.modules.location.next.locationProviders

import expo.modules.location.next.LocationProvider
import expo.modules.location.next.LocationWatchHandle
import expo.modules.location.next.Position
import expo.modules.location.next.ProviderOutcome

class FallbackLocationProvider(val locationProviders: List<LocationProvider>): LocationProvider {
  override suspend fun getCurrentPosition(): ProviderOutcome<Position> {
    var outcome: ProviderOutcome<Position> = ProviderOutcome.Unsupported
    for (locationProvider in locationProviders) {
      val position = locationProvider.getCurrentPosition()
      when (position) {
        is ProviderOutcome.Success -> return position
        ProviderOutcome.Unavailable -> outcome = ProviderOutcome.Unavailable
        // Note that the operation is only unsupported if it is unsupported for all of the providers
        ProviderOutcome.Unsupported -> continue
      }
    }
    return outcome
  }

  override fun watchPosition(): ProviderOutcome<LocationWatchHandle> {
    var outcome: ProviderOutcome<LocationWatchHandle> = ProviderOutcome.Unsupported
    for (locationProvider in locationProviders) {
      val watchHandle = locationProvider.watchPosition()
      when (watchHandle) {
        is ProviderOutcome.Success -> return watchHandle
        ProviderOutcome.Unavailable -> outcome = ProviderOutcome.Unavailable
        // Note that the operation is only unsupported if it is unsupported for all of the providers
        ProviderOutcome.Unsupported -> continue
      }
    }
    return outcome
  }

  override suspend fun getLastKnownPosition(): Position? {
    return locationProviders.firstNotNullOfOrNull { it.getLastKnownPosition() }
  }
}