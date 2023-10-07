package expo.modules.trackingtransparency

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.google.android.gms.ads.identifier.AdvertisingIdClient;
import android.content.Context
import expo.modules.kotlin.exception.Exceptions

class TrackingTransparencyModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoTrackingTransparency")

    AsyncFunction("getAdvertisingIdAsync") {
      return@AsyncFunction getAdvertisingIdAsync()
    }
  }

  private fun getAdvertisingIdAsync(): String? {
      return AdvertisingIdClient.getAdvertisingIdInfo(context).id
  }
}
