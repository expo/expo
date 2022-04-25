package expo.modules.webbrowser

import expo.modules.core.interfaces.InternalModule
import expo.modules.webbrowser.error.PackageManagerNotFoundException
import expo.modules.core.errors.CurrentActivityNotFoundException
import android.content.Intent
import java.util.ArrayList

interface CustomTabsActivitiesHelper : InternalModule {
  @get:Throws(PackageManagerNotFoundException::class, CurrentActivityNotFoundException::class)
  val customTabsResolvingActivities: ArrayList<String>

  @get:Throws(PackageManagerNotFoundException::class, CurrentActivityNotFoundException::class)
  val customTabsResolvingServices: ArrayList<String>

  @Throws(PackageManagerNotFoundException::class, CurrentActivityNotFoundException::class)
  fun getPreferredCustomTabsResolvingActivity(packages: List<String?>?): String?

  @get:Throws(PackageManagerNotFoundException::class, CurrentActivityNotFoundException::class)
  val defaultCustomTabsResolvingActivity: String?

  @Throws(CurrentActivityNotFoundException::class)
  fun startCustomTabs(intent: Intent)

  @Throws(PackageManagerNotFoundException::class, CurrentActivityNotFoundException::class)
  fun canResolveIntent(intent: Intent): Boolean
}
