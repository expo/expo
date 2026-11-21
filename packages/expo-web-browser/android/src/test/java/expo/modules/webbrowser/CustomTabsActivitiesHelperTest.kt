package expo.modules.webbrowser

import android.app.Activity
import android.content.Intent
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.net.toUri
import expo.modules.kotlin.AppContext
import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.slot
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class CustomTabsActivitiesHelperTest {
  @Test
  fun `proxy activity starts in a cleared task`() {
    // given
    val activity = mockk<Activity>(relaxed = true)
    val appContext = mockk<AppContext>()
    every { appContext.throwingActivity } returns activity
    val startedIntent = slot<Intent>()
    every { activity.startActivity(capture(startedIntent)) } just Runs
    val helper = CustomTabsActivitiesHelper(appContext)
    val tabsIntent = CustomTabsIntent.Builder().build().apply {
      intent.data = "https://expo.dev".toUri()
    }

    // when
    helper.startCustomTabs(tabsIntent, OpenBrowserOptions(useProxyActivity = true))

    // then
    val intent = startedIntent.captured
    assertEquals(BrowserProxyActivity::class.java.name, intent.component?.className)
    // A task left behind by a killed process must not be brought back as it was.
    val expectedFlags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
    assertEquals(expectedFlags, intent.flags and expectedFlags)
  }
}
