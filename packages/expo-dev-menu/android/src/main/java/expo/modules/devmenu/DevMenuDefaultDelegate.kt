package expo.modules.devmenu

import android.os.Bundle
import com.facebook.react.ReactHost
import expo.interfaces.devmenu.DevMenuDelegateInterface

/**
 * Basic [DevMenuDelegateInterface] implementation.
 */
class DevMenuDefaultDelegate(
  private val delegateHost: ReactHost
) : DevMenuDelegateInterface {
  override fun appInfo(): Bundle? = null

  override fun reactHost(): ReactHost = delegateHost
}
