package expo.modules.trackingtransparency

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import com.google.android.gms.ads.identifier.AdvertisingIdClient
import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class TrackingTransparencyModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    // TODO: Rename the package to 'ExpoTracking'
    Name("ExpoTrackingTransparency")

    Function("getAdvertisingId") {
      return@Function getAdvertisingId()
    }

    AsyncFunction("getAdvertisingIdAsync") Coroutine { ->
      withContext(Dispatchers.IO) { getAdvertisingId() }
    }
  }

  private fun getAdvertisingId(): String? {
    return AdvertisingIdClient.getAdvertisingIdInfo(context).id
  }
}
