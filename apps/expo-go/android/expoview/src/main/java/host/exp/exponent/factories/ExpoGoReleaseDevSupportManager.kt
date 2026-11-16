package host.exp.exponent.factories

import com.facebook.react.devsupport.ReleaseDevSupportManager
import host.exp.exponent.kernel.Kernel

/**
 * React Native's release manager crashes the process on error and does nothing on reload. Expo Go
 * hosts many projects and its own home screen, so it shows the Expo error screen instead and reloads
 * the project from its manifest.
 */
internal class ExpoGoReleaseDevSupportManager :
  ReleaseDevSupportManager(),
  ExpoGoDevSupportManager {

  override var exponentActivityId: Int = -1

  override fun handleException(e: Exception) {
    Kernel.handleReactNativeError(e.message, null, -1, true)
  }

  override fun handleReloadJS() {
    Kernel.reloadVisibleExperience(exponentActivityId)
  }
}
