package expo.modules.devmenu

import android.os.Bundle
import com.facebook.react.ReactInstanceManager

interface DevMenuDelegateProtocol {
  fun appInfo(): Bundle?

  fun reactInstanceManager(): ReactInstanceManager
}
