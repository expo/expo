package expo.interfaces.devmenu

import android.os.Bundle

interface DevMenuDelegateInterface {
  /**
   * Returns a `Bundle` with the most important information about the current app.
   */
  fun appInfo(): Bundle?

  /**
   * Returns a [ReactHostWrapper] ot the currently shown app. It is a context of what the dev menu displays.
   */
  fun reactHost(): ReactHostWrapper

  fun supportsDevelopment(): Boolean {
    return true
  }
}
