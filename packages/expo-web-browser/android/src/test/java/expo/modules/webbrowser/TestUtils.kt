package expo.modules.webbrowser

import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsSession
import io.mockk.CapturingSlot
import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import io.mockk.mockk

internal fun mockkCustomTabsActivitiesHelper(
  services: ArrayList<String> = ArrayList(),
  activities: ArrayList<String> = ArrayList(),
  preferredActivity: String? = null,
  defaultActivity: String? = null,
  startIntentSlot: CapturingSlot<CustomTabsIntent>? = null,
  defaultCanResolveIntent: Boolean = false
): CustomTabsActivitiesHelper {
  return mockk<CustomTabsActivitiesHelper>(relaxed = true).also {
    every { it.canResolveIntent(any()) } returns defaultCanResolveIntent
    every { it.customTabsResolvingActivities } returns activities
    every { it.customTabsResolvingServices } returns services
    every { it.getPreferredCustomTabsResolvingActivity(any()) } returns preferredActivity
    every { it.defaultCustomTabsResolvingActivity } returns defaultActivity

    if (startIntentSlot != null) {
      every { it.startCustomTabs(capture(startIntentSlot), any<OpenBrowserOptions>()) } just Runs
    }
  }
}

internal fun mockkCustomTabsConnectionHelper(
  keepAliveSession: CustomTabsSession? = null
): CustomTabsConnectionHelper {
  return mockk<CustomTabsConnectionHelper>(relaxed = true).also {
    every { it.requestKeepAliveSession(any(), any()) } answers {
      secondArg<(CustomTabsSession?) -> Unit>().invoke(keepAliveSession)
    }
  }
}
