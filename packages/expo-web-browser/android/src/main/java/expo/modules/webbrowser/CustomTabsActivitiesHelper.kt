package expo.modules.webbrowser

import android.app.Activity
import expo.modules.core.errors.CurrentActivityNotFoundException
import android.content.pm.ResolveInfo
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsService
import expo.modules.core.interfaces.ActivityProvider
import java.util.ArrayList
import java.util.LinkedHashSet

private const val DUMMY_URL = "https://expo.dev"

internal class CustomTabsActivitiesHelper(
  private val activityProvider: ActivityProvider?
) {

  // region Actual custom tabs activities helper methods

  /**
   * @throws CurrentActivityNotFoundException
   * @throws PackageManagerNotFoundException
   */
  fun canResolveIntent(intent: Intent): Boolean = getResolvingActivities(intent).isNotEmpty()

  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  val customTabsResolvingActivities: ArrayList<String>
    get() = getResolvingActivities(createDefaultCustomTabsIntent())
      .mapToDistinctArrayList { resolveInfo: ResolveInfo ->
        resolveInfo.activityInfo.packageName
      }

  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  val customTabsResolvingServices: ArrayList<String>
    get() = packageManager.queryIntentServices(createDefaultCustomTabsServiceIntent(), 0)
      .mapToDistinctArrayList { resolveInfo: ResolveInfo ->
        resolveInfo.serviceInfo.packageName
      }

  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  fun getPreferredCustomTabsResolvingActivity(packages: List<String?>?): String? {
    val resolvedPackages = packages ?: customTabsResolvingActivities
    return CustomTabsClient.getPackageName(currentActivity, resolvedPackages)
  }

  /**
   * @throws PackageManagerNotFoundException
   * @throws CurrentActivityNotFoundException
   */
  val defaultCustomTabsResolvingActivity: String?
    get() {
      val info = packageManager.resolveActivity(createDefaultCustomTabsIntent(), 0)
      return info?.activityInfo?.packageName
    }

  /**
   * @throws CurrentActivityNotFoundException
   */
  fun startCustomTabs(intent: Intent) {
    currentActivity.startActivity(intent)
  }

  // endregion

  // region Private helpers

  /**
   * @throws CurrentActivityNotFoundException
   * @throws PackageManagerNotFoundException
   */
  private fun getResolvingActivities(intent: Intent): List<ResolveInfo> {
    return packageManager.queryIntentActivities(intent, 0)
  }

  /**
   * @throws CurrentActivityNotFoundException
   * @throws PackageManagerNotFoundException
   */
  private val packageManager: PackageManager
    get() = currentActivity.packageManager ?: throw PackageManagerNotFoundException()

  /**
   * @throws CurrentActivityNotFoundException
   */
  private val currentActivity: Activity
    get() {
      return activityProvider?.currentActivity ?: throw CurrentActivityNotFoundException()
    }

  // endregion
}

private inline fun <T, R> Collection<T>.mapToDistinctArrayList(mapper: (T) -> R): ArrayList<R> {
  val resultSet = LinkedHashSet<R>()
  for (element in this) {
    resultSet.add(mapper.invoke(element))
  }
  return ArrayList(resultSet)
}

private fun createDefaultCustomTabsIntent(): Intent {
  val customTabsIntent = CustomTabsIntent.Builder().build()
  return customTabsIntent.intent.apply {
    data = Uri.parse(DUMMY_URL)
  }
}

private fun createDefaultCustomTabsServiceIntent() = Intent().apply {
  action = CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION
}
