package expo.modules.webbrowser

import android.content.Intent
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
  startIntentSlot: CapturingSlot<Intent>? = null,
  defaultCanResolveIntent: Boolean = false
): CustomTabsActivitiesHelper {
  return mockk<CustomTabsActivitiesHelper>(relaxed = true).also {
    every { it.canResolveIntent(any()) } returns defaultCanResolveIntent
    every { it.customTabsResolvingActivities } returns activities
    every { it.customTabsResolvingServices } returns services
    every { it.getPreferredCustomTabsResolvingActivity(any()) } returns preferredActivity
    every { it.defaultCustomTabsResolvingActivity } returns defaultActivity

    if (startIntentSlot != null) {
      every { it.startCustomTabs(capture(startIntentSlot)) } just Runs
    }
  }
}

internal fun mockkCustomTabsConnectionHelper(): CustomTabsConnectionHelper {
  return mockk(relaxed = true)
}
