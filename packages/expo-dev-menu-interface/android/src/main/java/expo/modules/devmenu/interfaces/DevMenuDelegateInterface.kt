package expo.modules.devmenu.interfaces

import android.os.Bundle
import com.facebook.react.ReactInstanceManager

interface DevMenuDelegateInterface {
  /**
   * Returns a `Bundle` with the most important information about the current app.
   */
  fun appInfo(): Bundle?

  /**
   * Returns a `ReactInstanceManager` ot the currently shown app. It is a context of what the dev menu displays.
   */
  fun reactInstanceManager(): ReactInstanceManager
}
