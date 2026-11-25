package expo.modules.mediasession

import android.app.Activity
import android.app.Application
import android.os.Bundle

// Main thread only.
internal class AppVisibility(
  private val onBackground: () -> Unit,
  private val onForeground: () -> Unit
) {
  private val started = mutableSetOf<Int>()
  private var changingConfigurations = false

  fun started(activity: Int) {
    val wasHidden = started.isEmpty()
    started.add(activity)
    if (wasHidden && !changingConfigurations) {
      onForeground()
    }
    changingConfigurations = false
  }

  fun stopped(activity: Int, isChangingConfigurations: Boolean) {
    started.remove(activity)
    if (started.isNotEmpty()) {
      return
    }
    if (isChangingConfigurations) {
      changingConfigurations = true
    } else {
      onBackground()
    }
  }
}

internal class AppVisibilitySource(
  private val application: Application,
  coordinator: SessionCoordinator
) : Application.ActivityLifecycleCallbacks {
  private val visibility = AppVisibility(coordinator::onBackground, coordinator::onForeground)

  fun start() {
    application.registerActivityLifecycleCallbacks(this)
  }

  fun stop() {
    application.unregisterActivityLifecycleCallbacks(this)
  }

  override fun onActivityStarted(activity: Activity) {
    visibility.started(System.identityHashCode(activity))
  }

  override fun onActivityStopped(activity: Activity) {
    visibility.stopped(System.identityHashCode(activity), activity.isChangingConfigurations)
  }

  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}

  override fun onActivityResumed(activity: Activity) {}

  override fun onActivityPaused(activity: Activity) {}

  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}

  override fun onActivityDestroyed(activity: Activity) {}
}
