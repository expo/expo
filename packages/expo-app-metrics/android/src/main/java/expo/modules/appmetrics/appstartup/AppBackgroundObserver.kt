package expo.modules.appmetrics.appstartup

import android.app.Activity
import android.app.Application
import android.os.Bundle

/**
 * Tells `AppStartupManager` when the app enters the background, that is when no activity is started.
 * `onPause` is not enough, because it is also called when a dialog or another app's sheet covers the activity.
 */
internal class AppBackgroundObserver : Application.ActivityLifecycleCallbacks {
  private var startedActivities = 0

  override fun onActivityStarted(activity: Activity) {
    startedActivities++
  }

  override fun onActivityStopped(activity: Activity) {
    startedActivities = maxOf(startedActivities - 1, 0)
    // A configuration change stops the activity, but the app stays in the foreground.
    if (startedActivities == 0 && !activity.isChangingConfigurations) {
      AppStartupManager.markEnteredBackground(activity)
    }
  }

  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit

  override fun onActivityResumed(activity: Activity) = Unit

  override fun onActivityPaused(activity: Activity) = Unit

  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

  override fun onActivityDestroyed(activity: Activity) = Unit
}
