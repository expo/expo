package expo.modules.trackingtransparency

import com.google.android.gms.ads.identifier.AdvertisingIdClient
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext

// TODO: Rename the package to 'ExpoTracking'
@ExpoModule("ExpoTrackingTransparency")
class TrackingTransparencyModule : Module() {
  @JS
  fun getAdvertisingId(): String? {
    return AdvertisingIdClient.getAdvertisingIdInfo(androidContext).id
  }
}
