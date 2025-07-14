package expo.modules.kotlin

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
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
class ReactLifecycleDelegate(appContext: AppContext) : LifecycleEventListener, ActivityEventListener {
  private val appContextHolder = WeakReference(appContext)

  override fun onHostResume() {
    appContextHolder.get()?.onHostResume()
  }

  override fun onHostPause() {
    appContextHolder.get()?.onHostPause()
  }

  override fun onUserLeaveHint(activity: Activity) {
    appContextHolder.get()?.onUserLeaveHint()
  }

  override fun onHostDestroy() {
    appContextHolder.get()?.onHostDestroy()
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    appContextHolder.get()?.onActivityResult(activity, requestCode, resultCode, data)
  }

  override fun onNewIntent(intent: Intent) {
    appContextHolder.get()?.onNewIntent(intent)
  }
}
