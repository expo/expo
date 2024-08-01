package expo.modules.devmenu

import android.os.Bundle
import expo.interfaces.devmenu.DevMenuDelegateInterface
import expo.interfaces.devmenu.ReactHostWrapper

/**
 * Basic [DevMenuDelegateInterface] implementation.
 */
class DevMenuDefaultDelegate(
  private val delegateHost: ReactHostWrapper
) : DevMenuDelegateInterface {
  override fun appInfo(): Bundle? = null

  override fun reactHost(): ReactHostWrapper = delegateHost
}
