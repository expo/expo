package expo.modules.webbrowser

import expo.modules.core.interfaces.InternalModule
import expo.modules.webbrowser.error.PackageManagerNotFoundException
import expo.modules.core.errors.CurrentActivityNotFoundException
import android.content.Intent
import java.util.ArrayList

interface CustomTabsActivitiesHelper : InternalModule {
  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  val customTabsResolvingActivities: ArrayList<String>

  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  val customTabsResolvingServices: ArrayList<String>

  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  fun getPreferredCustomTabsResolvingActivity(packages: List<String?>?): String?

  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  val defaultCustomTabsResolvingActivity: String?

  /**
   * @throws CurrentActivityNotFoundException
   */
  fun startCustomTabs(intent: Intent)

  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  fun canResolveIntent(intent: Intent): Boolean
}
