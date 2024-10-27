package versioned.host.exp.exponent

import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.reanimated.ReanimatedPackage
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.expoview.Exponent

class ExpoReanimatedPackage : ReanimatedPackage() {
  override fun getReactInstanceManager(reactContext: ReactApplicationContext?): ReactInstanceManager {
    val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity
      ?: return super.getReactInstanceManager(reactContext)
    return currentActivity.reactNativeHost?.reactInstanceManager ?: super.getReactInstanceManager(reactContext)
  }
}
