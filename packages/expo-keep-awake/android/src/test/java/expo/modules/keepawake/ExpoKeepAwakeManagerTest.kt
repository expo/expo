package expo.modules.keepawake

import android.app.Activity
import android.view.WindowManager
import com.facebook.react.bridge.ReactContext
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
class ExpoKeepAwakeManagerTest {
  private var currentActivity: Activity? = null
  private val reactContext = mockk<ReactContext>(relaxed = true) {
    every { currentActivity } answers { this@ExpoKeepAwakeManagerTest.currentActivity }
  }
  private val manager = ExpoKeepAwakeManager { reactContext }

  @Before
  fun setUp() {
    Dispatchers.setMain(UnconfinedTestDispatcher())
  }

  @After
  fun tearDown() {
    Dispatchers.resetMain()
  }

  @Test
  fun `keeps the screen on in an Activity that resumes after activate`() = runTest {
    currentActivity = newActivity()
    manager.activate("tag")

    val recreated = newActivity()
    currentActivity = recreated
    manager.onHostResume()

    assertTrue(recreated.keepsScreenOn)
  }

  @Test
  fun `deactivate without an Activity releases the tag`() = runTest {
    currentActivity = newActivity()
    manager.activate("tag")

    currentActivity = null
    manager.deactivate("tag")

    assertFalse(manager.isActivated)
    val recreated = newActivity()
    currentActivity = recreated
    manager.onHostResume()
    assertFalse(recreated.keepsScreenOn)
  }

  private fun newActivity(): Activity =
    Robolectric.buildActivity(Activity::class.java).setup().get()

  private val Activity.keepsScreenOn: Boolean
    get() = window.attributes.flags and WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON != 0
}
