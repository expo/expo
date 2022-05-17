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

internal fun browserArguments(
  toolbarColor: String = "#000000",
  toolbarSecondaryColor: String = "#000000",
  browserPackage: String = "com.browser",
  enableBarCollapsing: Boolean = true,
  showTitle: Boolean = true,
  enableDefaultShareMenuItem: Boolean = true,
  showInRecents: Boolean = true,
  createTask: Boolean = true
) = OpenBrowserOptions().apply {
  this.toolbarColor = toolbarColor
  this.secondaryToolbarColor = toolbarSecondaryColor
  this.browserPackage = browserPackage
  this.enableBarCollapsing = enableBarCollapsing
  this.showTitle = showTitle
  this.enableDefaultShareMenuItem = enableDefaultShareMenuItem
  this.showInRecents = showInRecents
  this.shouldCreateTask = createTask
}
