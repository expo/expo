package expo.modules.screencapture

import android.app.Activity
import android.app.Application
import android.view.WindowManager
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.android.controller.ActivityController

@RunWith(RobolectricTestRunner::class)
class SecureFlagManagerTest {
  private val application: Application = RuntimeEnvironment.getApplication()
  private val manager = SecureFlagManager()

  // The React activity is already running when the module registers the manager
  private lateinit var hostActivity: Activity

  private val Activity.isSecure: Boolean
    get() = (window.attributes.flags and WindowManager.LayoutParams.FLAG_SECURE) != 0

  private fun startActivity(): ActivityController<Activity> =
    Robolectric.buildActivity(Activity::class.java).setup()

  @Before
  fun registerManager() {
    hostActivity = startActivity().get()
    application.registerActivityLifecycleCallbacks(manager)
  }

  @After
  fun unregisterManager() {
    application.unregisterActivityLifecycleCallbacks(manager)
  }

  @Test
  fun `prevent secures the host activity and the activities that are already open`() {
    val fullscreenActivity = startActivity().get()

    manager.setScreenCapturePrevented(true, hostActivity)

    assertTrue(hostActivity.isSecure)
    assertTrue(fullscreenActivity.isSecure)
  }

  @Test
  fun `activities that start while capture is prevented are secure`() {
    manager.setScreenCapturePrevented(true, hostActivity)

    val fullscreenActivity = startActivity().get()

    assertTrue(fullscreenActivity.isSecure)
  }

  @Test
  fun `an activity that started before the manager is secure when it starts again`() {
    application.unregisterActivityLifecycleCallbacks(manager)
    val nativeController = startActivity()
    application.registerActivityLifecycleCallbacks(manager)
    manager.setScreenCapturePrevented(true, hostActivity)

    nativeController.pause().stop().restart()

    assertTrue(nativeController.get().isSecure)
  }

  @Test
  fun `allow clears the flag on every activity`() {
    val fullscreenActivity = startActivity().get()
    manager.setScreenCapturePrevented(true, hostActivity)
    assertTrue(fullscreenActivity.isSecure)

    manager.setScreenCapturePrevented(false, hostActivity)

    assertFalse(hostActivity.isSecure)
    assertFalse(fullscreenActivity.isSecure)
    assertFalse(startActivity().get().isSecure)
  }

  @Test
  fun `allow without an earlier prevent keeps the flag that other code set on other activities`() {
    val sdkActivity = startActivity().get()
    sdkActivity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)

    manager.setScreenCapturePrevented(false, hostActivity)

    assertTrue(sdkActivity.isSecure)
  }

  @Test
  fun `prevent and allow work when there is no host activity`() {
    manager.setScreenCapturePrevented(true, null)
    val activity = startActivity().get()
    assertTrue(activity.isSecure)

    manager.setScreenCapturePrevented(false, null)
    assertFalse(activity.isSecure)
    assertFalse(startActivity().get().isSecure)
  }
}
