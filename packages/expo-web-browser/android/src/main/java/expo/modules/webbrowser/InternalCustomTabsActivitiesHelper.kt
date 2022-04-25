package expo.modules.webbrowser

import android.app.Activity
import expo.modules.webbrowser.error.PackageManagerNotFoundException
import expo.modules.core.errors.CurrentActivityNotFoundException
import android.content.pm.ResolveInfo
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsService
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ActivityProvider
import java.util.ArrayList
import java.util.LinkedHashSet

private const val DUMMY_URL = "https://expo.dev"

internal class InternalCustomTabsActivitiesHelper : CustomTabsActivitiesHelper {
  private lateinit var moduleRegistry: ModuleRegistry

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }
  override fun onDestroy() = Unit
  override fun getExportedInterfaces(): List<Class<*>?> =
    listOf(CustomTabsActivitiesHelper::class.java)

  @Throws(PackageManagerNotFoundException::class, CurrentActivityNotFoundException::class)
  override fun canResolveIntent(intent: Intent): Boolean = getResolvingActivities(intent).isNotEmpty()

  override val customTabsResolvingActivities: ArrayList<String>
    get() = getResolvingActivities(createDefaultCustomTabsIntent())
      .mapToDistinctArrayList { resolveInfo: ResolveInfo ->
        resolveInfo.activityInfo.packageName
      }

  override val customTabsResolvingServices: ArrayList<String>
    get() = packageManager.queryIntentServices(createDefaultCustomTabsServiceIntent(), 0)
      .mapToDistinctArrayList { resolveInfo: ResolveInfo ->
        resolveInfo.serviceInfo.packageName
      }

  override fun getPreferredCustomTabsResolvingActivity(packages: List<String?>?): String? {
    val resolvedPackages = packages ?: customTabsResolvingActivities
    return CustomTabsClient.getPackageName(currentActivity, resolvedPackages)
  }

  override val defaultCustomTabsResolvingActivity: String?
    get() {
        val info = packageManager.resolveActivity(createDefaultCustomTabsIntent(), 0)
        return info?.activityInfo?.packageName
    }

  @Throws(CurrentActivityNotFoundException::class)
  override fun startCustomTabs(intent: Intent) {
    currentActivity.startActivity(intent)
  }

  @Throws(PackageManagerNotFoundException::class, CurrentActivityNotFoundException::class)
  private fun getResolvingActivities(intent: Intent): List<ResolveInfo> {
    return packageManager.queryIntentActivities(intent, 0)
  }

  @get:Throws(PackageManagerNotFoundException::class, CurrentActivityNotFoundException::class)
  private val packageManager: PackageManager
    get() = currentActivity.packageManager ?: throw PackageManagerNotFoundException()

  @get:Throws(CurrentActivityNotFoundException::class)
  private val currentActivity: Activity
    get() {
      val activityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
      return activityProvider?.currentActivity ?: throw CurrentActivityNotFoundException()
    }

  private fun createDefaultCustomTabsIntent(): Intent {
    val builder = CustomTabsIntent.Builder()
    val customTabsIntent = builder.build()
    val intent = customTabsIntent.intent
    intent.data = Uri.parse(DUMMY_URL)
    return intent
  }

  private fun createDefaultCustomTabsServiceIntent() = Intent().apply {
    action = CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION
  }
}

private inline fun <T, R> Collection<T>.mapToDistinctArrayList(mapper: (T) -> R): ArrayList<R> {
  val resultSet = LinkedHashSet<R>()
  for (element in this) {
    resultSet.add(mapper.invoke(element))
  }
  return ArrayList(resultSet)
}
