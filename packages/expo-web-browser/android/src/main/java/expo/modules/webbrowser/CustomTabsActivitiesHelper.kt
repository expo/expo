package expo.modules.webbrowser

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsService
import androidx.core.net.toUri
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.kotlin.AppContext

private const val DUMMY_URL = "https://expo.dev"

internal class CustomTabsActivitiesHelper(
  private val appContext: AppContext
) {

  // region Actual custom tabs activities helper methods

  /**
   * @throws CurrentActivityNotFoundException
   * @throws PackageManagerNotFoundException
   */
  fun canResolveIntent(customTabsIntent: CustomTabsIntent): Boolean =
    getResolvingActivities(customTabsIntent).isNotEmpty()

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
      val info = packageManager.resolveActivity(createDefaultCustomTabsIntent().intent, 0)
      return info?.activityInfo?.packageName
    }

  /**
   * @throws CurrentActivityNotFoundException
   */
  fun startCustomTabs(tabsIntent: CustomTabsIntent) {
    tabsIntent.intent.data?.let {
      tabsIntent.launchUrl(currentActivity, it)
    } ?: throw NoUrlProvidedException()
  }

  // endregion

  // region Private helpers

  /**
   * @throws CurrentActivityNotFoundException
   * @throws PackageManagerNotFoundException
   */
  private fun getResolvingActivities(customTabsIntent: CustomTabsIntent): List<ResolveInfo> {
    return packageManager.queryIntentActivities(customTabsIntent.intent, 0)
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
    get() = appContext.throwingActivity

  // endregion
}

private inline fun <T, R> Collection<T>.mapToDistinctArrayList(mapper: (T) -> R): ArrayList<R> {
  val resultSet = LinkedHashSet<R>()
  for (element in this) {
    resultSet.add(mapper.invoke(element))
  }
  return ArrayList(resultSet)
}

private fun createDefaultCustomTabsIntent(): CustomTabsIntent {
  val customTabsIntent = CustomTabsIntent.Builder().build()
  return customTabsIntent.apply {
    intent.data = DUMMY_URL.toUri()
  }
}

private fun createDefaultCustomTabsServiceIntent() = Intent().apply {
  action = CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION
}
