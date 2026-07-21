package expo.modules.location.next.locationProviders

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import android.os.Looper
import expo.modules.location.next.LocationProvider
import expo.modules.location.next.LocationWatchHandle
import expo.modules.location.next.Position
import expo.modules.location.next.ProviderOutcome
import expo.modules.location.next.toPosition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class AndroidLocationProvider(private val context: Context): LocationProvider {
  @SuppressLint("MissingPermission")
  override suspend fun getCurrentPosition(): ProviderOutcome<Position> {
    // TODO(@HubertBer) Add options, handle the other older android API versions
    val provider = LocationManager.GPS_PROVIDER
    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val location: Location = suspendCancellableCoroutine { continuation ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val signal = CancellationSignal()
        continuation.invokeOnCancellation { signal.cancel() }
        return@suspendCancellableCoroutine locationManager.getCurrentLocation(
          provider,
          signal,
          context.mainExecutor
        ) { location ->
          continuation.resume(location)
        }
      }

      val listener = LocationListener { TODO("Not yet implemented") }
      locationManager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
      continuation.invokeOnCancellation { locationManager.removeUpdates(listener) }
    }
    return ProviderOutcome.Success(location.toPosition())
  }


  override fun watchPosition(): ProviderOutcome<LocationWatchHandle> {
    TODO("")
//    Log.d("LOC", "Watch position async")
  }

  override suspend fun getLastKnownPosition(): Position? {
    TODO("Not yet implemented")
  }
}
