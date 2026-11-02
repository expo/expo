package expo.modules.appmetrics.appstartup

import android.app.Activity
import expo.modules.appmetrics.utils.TimeUtils.getCurrentTimeInMillis
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class AppBackgroundObserverTest {
  private fun activity(): Activity = Robolectric.buildActivity(Activity::class.java).get()

  @Test
  fun `marks the background only when the last started activity stops`() {
    val observer = AppBackgroundObserver()
    val first = activity()
    val second = activity()
    var backgroundedLogs = 0
    AppStartupManager.onLogRecorded = { backgroundedLogs++ }
    AppStartupManager.takeUnsavedLogs()
    AppStartupManager::class.java.getDeclaredField("launchTimeInMillis").apply {
      isAccessible = true
    }.set(AppStartupManager, getCurrentTimeInMillis())
    AppStartupManager.startupState = StartupState.LAUNCHING

    observer.onActivityStarted(first)
    AppStartupManager.markPaused()
    // The app opens its own second activity, so the app stays in the foreground.
    observer.onActivityStarted(second)
    observer.onActivityStopped(first)
    assertEquals(0, backgroundedLogs)

    observer.onActivityStopped(second)
    AppStartupManager.onLogRecorded = null

    assertEquals(1, backgroundedLogs)
    assertEquals(1, AppStartupManager.takeUnsavedLogs().size)
  }
}
