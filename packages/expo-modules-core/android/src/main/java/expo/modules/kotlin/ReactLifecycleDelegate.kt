package expo.modules.kotlin

import com.facebook.react.bridge.LifecycleEventListener
import java.lang.ref.WeakReference

/**
 * We had to extract this from AppContext, because otherwise, we can't access AppContext
 * in a package that doesn't depend on the React Native directly.
 * Due to:
 * Cannot access 'com.facebook.react.bridge.LifecycleEventListener'
 * which is a supertype of 'expo.modules.kotlin.AppContext'.
 * Check your module classpath for missing or conflicting dependencies
 */
class ReactLifecycleDelegate(appContext: AppContext) : LifecycleEventListener {
  private val appContextHolder = WeakReference(appContext)

  override fun onHostResume() {
    appContextHolder.get()?.onHostResume()
  }

  override fun onHostPause() {
    appContextHolder.get()?.onHostPause()
  }

  override fun onHostDestroy() {
    appContextHolder.get()?.onHostDestroy()
  }
}
