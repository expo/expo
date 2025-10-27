package expo.interfaces.devmenu

import android.os.Bundle
import com.facebook.react.ReactHost

interface DevMenuDelegateInterface {
  /**
   * Returns a `Bundle` with the most important information about the current app.
   */
  fun appInfo(): Bundle?

  /**
   * Returns a [ReactHost] of the currently shown app. It is a context of what the dev menu displays.
   */
  fun reactHost(): ReactHost

  fun supportsDevelopment(): Boolean {
    return true
  }
}
