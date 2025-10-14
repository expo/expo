package expo.modules.trackingtransparency

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.google.android.gms.ads.identifier.AdvertisingIdClient
import com.google.android.gms.common.GoogleApiAvailabilityLight
import com.google.android.gms.common.ConnectionResult
import android.content.Context
import expo.modules.kotlin.exception.Exceptions

class TrackingTransparencyModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    // TODO: Rename the package to 'ExpoTracking'
    Name("ExpoTrackingTransparency")

    Function<Boolean>("isAvailable") {
      val apiAvailability = GoogleApiAvailabilityLight.getInstance()
      val resultCode = apiAvailability.isGooglePlayServicesAvailable(context)
      return@Function resultCode == ConnectionResult.SUCCESS
    }

    Function<String?>("getAdvertisingId") {
      return@Function AdvertisingIdClient.getAdvertisingIdInfo(context).id
    }
  }
}
