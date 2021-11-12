package expo.modules.core.interfaces

import android.app.Activity
import com.facebook.react.ReactRootView

/**
 * A handler API for modules to override default ReactActivity behaviors.
 * Used by {@link ReactActivityDelegateWrapper}
 */
interface ReactActivityHandler {
  /**
   * Given modules a chance to override the default {@link ReactRootView}
   * @return the override ReactRootView instance or null if not to override
   */
  fun createReactRootView(activity: Activity): ReactRootView? {
    return null
  }
}
