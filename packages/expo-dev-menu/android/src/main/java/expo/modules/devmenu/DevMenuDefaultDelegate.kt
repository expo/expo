package expo.modules.devmenu

import android.os.Bundle
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import expo.modules.devmenu.interfaces.DevMenuDelegateInterface

/**
 * Basic [DevMenuDelegateInterface] implementation.
 */
class DevMenuDefaultDelegate(
  private val delegateHost: ReactNativeHost
) : DevMenuDelegateInterface {
  override fun appInfo(): Bundle? = null

  override fun reactInstanceManager(): ReactInstanceManager = delegateHost.reactInstanceManager
}
