package expo.modules.screencapture

import android.app.Activity
import android.app.Application
import android.os.Bundle
import android.view.WindowManager
import androidx.annotation.MainThread
import java.util.Collections
import java.util.WeakHashMap

internal class SecureFlagManager : Application.ActivityLifecycleCallbacks {
  // Android can't list an app's open activities, so we track them here. The React activity
  // is already running when the module registers these callbacks, so the caller passes it in
  private val activities = Collections.newSetFromMap<Activity>(WeakHashMap())
  private var isScreenCapturePrevented = false

  @MainThread
  fun setScreenCapturePrevented(prevented: Boolean, currentActivity: Activity?) {
    // If prevent was never called, allow only clears the current activity. Other activities
    // may have `FLAG_SECURE` set by other code
    val targets = if (prevented || isScreenCapturePrevented) {
      activities + listOfNotNull(currentActivity)
    } else {
      listOfNotNull(currentActivity)
    }
    isScreenCapturePrevented = prevented
    targets.forEach { it.setSecureFlag(prevented) }
  }

  override fun onActivityStarted(activity: Activity) {
    activities.add(activity)
    if (isScreenCapturePrevented) {
      activity.setSecureFlag(true)
    }
  }

  override fun onActivityDestroyed(activity: Activity) {
    activities.remove(activity)
  }

  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit

  override fun onActivityResumed(activity: Activity) = Unit

  override fun onActivityPaused(activity: Activity) = Unit

  override fun onActivityStopped(activity: Activity) = Unit

  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
}

private fun Activity.setSecureFlag(secure: Boolean) {
  if (secure) {
    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
  } else {
    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }
}
