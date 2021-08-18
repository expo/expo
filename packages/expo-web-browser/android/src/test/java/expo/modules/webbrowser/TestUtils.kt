package expo.modules.webbrowser

import android.content.Intent
import io.mockk.CapturingSlot
import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import expo.modules.core.arguments.ReadableArguments
import org.unimodules.test.core.mockkInternalModule
import org.unimodules.test.core.readableArgumentsOf

fun mockkCustomTabsActivitiesHelper(
  services: ArrayList<String> = ArrayList(),
  activities: ArrayList<String> = ArrayList(),
  preferredActivity: String? = null,
  defaultActivity: String? = null,
  startIntentSlot: CapturingSlot<Intent>? = null,
  defaultCanResolveIntent: Boolean = false
): CustomTabsActivitiesHelper {

  return mockkInternalModule<CustomTabsActivitiesHelper>(relaxed = true).also {
    every { it.canResolveIntent(any()) } returns defaultCanResolveIntent
    every { it.customTabsResolvingActivities } returns activities
    every { it.customTabsResolvingServices } returns services
    every { it.getPreferredCustomTabsResolvingActivity(any()) } returns preferredActivity
    every { it.defaultCustomTabsResolvingActivity } returns defaultActivity
    every { it.exportedInterfaces } returns mutableListOf(CustomTabsActivitiesHelper::class.java)

    if (startIntentSlot != null) {
      every { it.startCustomTabs(capture(startIntentSlot)) } just Runs
    }
  }
}

fun mockkCustomTabsConnectionHelper(): CustomTabsConnectionHelper {
  return mockkInternalModule(relaxed = true)
}

fun browserArguments(
  toolbarColor: String = "#000000",
  toolbarSecondaryColor: String = "#000000",
  browserPackage: String = "com.browser",
  enableBarCollapsing: Boolean = true,
  showTitle: Boolean = true,
  enableDefaultShareMenuItem: Boolean = true,
  showInRecents: Boolean = true,
  createTask: Boolean = true
): ReadableArguments {
  // Move creation of readable arguments to TestUtils
  return readableArgumentsOf(
    mapOf(
      "toolbarColor" to toolbarColor,
      "toolbarSecondaryColor" to toolbarSecondaryColor,
      "browserPackage" to browserPackage,
      "enableBarCollapsing" to enableBarCollapsing,
      "showTitle" to showTitle,
      "enableDefaultShareMenuItem" to enableDefaultShareMenuItem,
      "showInRecents" to showInRecents,
      "createTask" to createTask
    )
  )
}
