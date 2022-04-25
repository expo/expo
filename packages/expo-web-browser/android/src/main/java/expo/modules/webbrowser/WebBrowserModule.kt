package expo.modules.webbrowser

import android.content.Context
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.webbrowser.error.NoPreferredPackageFound
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.webbrowser.error.PackageManagerNotFoundException
import expo.modules.core.arguments.ReadableArguments
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.text.TextUtils
import androidx.browser.customtabs.CustomTabsIntent
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.utilities.ifNull
import java.lang.IllegalArgumentException

private const val BROWSER_PACKAGE_KEY = "browserPackage"
private const val SERVICE_PACKAGE_KEY = "servicePackage"
private const val BROWSER_PACKAGES_KEY = "browserPackages"
private const val SERVICE_PACKAGES_KEY = "servicePackages"
private const val PREFERRED_BROWSER_PACKAGE = "preferredBrowserPackage"
private const val DEFAULT_BROWSER_PACKAGE = "defaultBrowserPackage"
private const val SHOW_IN_RECENTS = "showInRecents"
private const val CREATE_TASK = "createTask"
private const val DEFAULT_SHARE_MENU_ITEM = "enableDefaultShareMenuItem"
private const val TOOLBAR_COLOR_KEY = "toolbarColor"
private const val SECONDARY_TOOLBAR_COLOR_KEY = "secondaryToolbarColor"
private const val ERROR_CODE = "EXWebBrowser"
private const val TAG = "ExpoWebBrowser"
private const val SHOW_TITLE_KEY = "showTitle"
private const val ENABLE_BAR_COLLAPSING_KEY = "enableBarCollapsing"
private const val NO_PREFERRED_PACKAGE_MSG = "Cannot determine preferred package without satisfying it."

class WebBrowserModule(context: Context?) : ExportedModule(context) {
  private lateinit var customTabsResolver: CustomTabsActivitiesHelper
  private lateinit var connectionHelper: CustomTabsConnectionHelper

  override fun getName() = TAG

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    customTabsResolver = moduleRegistry.getModule(CustomTabsActivitiesHelper::class.java)
    connectionHelper = moduleRegistry.getModule(CustomTabsConnectionHelper::class.java)
  }

  @ExpoMethod
  fun warmUpAsync(packageName: String?, promise: Promise) {
    try {
      val resolvedPackageName = givenOrPreferredPackageName(packageName)
      connectionHelper.warmUp(resolvedPackageName)
      val result = Bundle().apply {
        putString(SERVICE_PACKAGE_KEY, resolvedPackageName)
      }
      promise.resolve(result)
    } catch (ex: NoPreferredPackageFound) {
      promise.reject(ex)
    }
  }

  @ExpoMethod
  fun coolDownAsync(packageName: String?, promise: Promise) {
    try {
      val resolvedPackageName = givenOrPreferredPackageName(packageName)
      if (connectionHelper.coolDown(resolvedPackageName)) {
        val result = Bundle().apply {
          putString(SERVICE_PACKAGE_KEY, resolvedPackageName)
        }
        promise.resolve(result)
      } else {
        promise.resolve(Bundle())
      }
    } catch (ex: NoPreferredPackageFound) {
      promise.reject(ex)
    }
  }

  @ExpoMethod
  fun mayInitWithUrlAsync(url: String?, packageName: String?, promise: Promise) {
    try {
      val resolvedPackageName = givenOrPreferredPackageName(packageName)
      connectionHelper.mayInitWithUrl(resolvedPackageName, Uri.parse(url))
      val result = Bundle().apply {
        putString(SERVICE_PACKAGE_KEY, resolvedPackageName)
      }
      promise.resolve(result)
    } catch (ex: NoPreferredPackageFound) {
      promise.reject(ex)
    }
  }

  @ExpoMethod
  fun getCustomTabsSupportingBrowsersAsync(promise: Promise) {
    try {
      val activities = customTabsResolver.customTabsResolvingActivities
      val services = customTabsResolver.customTabsResolvingServices
      val preferredPackage = customTabsResolver.getPreferredCustomTabsResolvingActivity(activities)
      val defaultPackage = customTabsResolver.defaultCustomTabsResolvingActivity

      // It might happen, that default activity does not support Chrome Tabs. Then it will be ResolvingActivity and we don't want to return it as a result.
      val defaultCustomTabsPackage: String? = defaultPackage.takeIf { activities.contains(it) }

      val result = Bundle().apply {
        putStringArrayList(BROWSER_PACKAGES_KEY, activities)
        putStringArrayList(SERVICE_PACKAGES_KEY, services)
        putString(PREFERRED_BROWSER_PACKAGE, preferredPackage)
        putString(DEFAULT_BROWSER_PACKAGE, defaultCustomTabsPackage)
      }
      promise.resolve(result)
    } catch (ex: CurrentActivityNotFoundException) {
      promise.reject(ex)
    } catch (ex: PackageManagerNotFoundException) {
      promise.reject(ex)
    }
  }

  /**
   * @param url Url to be opened by WebBrowser
   * @param arguments Required arguments are:
   * toolbarColor: String;
   * browserPackage: String;
   * enableBarCollapsing: Boolean;
   * showTitle: Boolean;
   * enableDefaultShareMenuItem: Boolean;
   * showInRecents: Boolean;
   * @param promise
   */
  @ExpoMethod
  fun openBrowserAsync(url: String?, arguments: ReadableArguments, promise: Promise) {
    val intent = createCustomTabsIntent(arguments)
    intent.data = Uri.parse(url)
    try {
      if (customTabsResolver.canResolveIntent(intent)) {
        customTabsResolver.startCustomTabs(intent)
        val result = Bundle().apply {
          putString("type", "opened")
        }
        promise.resolve(result)
      } else {
        promise.reject(ERROR_CODE, "No matching activity!")
      }
    } catch (ex: CurrentActivityNotFoundException) {
      promise.reject(ex)
    } catch (ex: PackageManagerNotFoundException) {
      promise.reject(ex)
    }
  }

  private fun createCustomTabsIntent(arguments: ReadableArguments): Intent {
    val color = arguments.getString(TOOLBAR_COLOR_KEY)
    val secondaryColor = arguments.getString(SECONDARY_TOOLBAR_COLOR_KEY)
    val packageName = arguments.getString(BROWSER_PACKAGE_KEY)
    val showTitle = arguments.getBoolean(SHOW_TITLE_KEY, false)
    val addDefaultShareMenuItem = arguments.getBoolean(DEFAULT_SHARE_MENU_ITEM, false)
    val enableBarCollapsing = arguments.getBoolean(ENABLE_BAR_COLLAPSING_KEY, false)
    val shouldCreateTask = arguments.getBoolean(CREATE_TASK, true)
    val showInRecents = arguments.getBoolean(SHOW_IN_RECENTS, false)

    val builder = CustomTabsIntent.Builder()
    try {
      if (!TextUtils.isEmpty(color)) {
        val intColor = Color.parseColor(color)
        builder.setToolbarColor(intColor)
      }
      if (!TextUtils.isEmpty(secondaryColor)) {
        val intSecondaryColor = Color.parseColor(secondaryColor)
        builder.setSecondaryToolbarColor(intSecondaryColor)
      }
    } catch (ignored: IllegalArgumentException) {
    }
    builder.setShowTitle(showTitle)
    if (addDefaultShareMenuItem) {
      builder.addDefaultShareMenuItem()
    }

    val intent = builder.build().intent

    // We cannot use builder's method enableUrlBarHiding, because there is no corresponding disable method and some browsers enables it by default.
    intent.putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, enableBarCollapsing)
    if (!TextUtils.isEmpty(packageName)) {
      intent.setPackage(packageName)
    }

    if (shouldCreateTask) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      if (!showInRecents) {
        intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
      }
    }
    return intent
  }

  @Throws(NoPreferredPackageFound::class)
  private fun givenOrPreferredPackageName(packageName: String?): String {
    val resolvedPackageName: String? = try {
      packageName?.takeIf { it.isNotEmpty() }.ifNull {
        customTabsResolver.getPreferredCustomTabsResolvingActivity(null)
      }
    } catch (ex: CurrentActivityNotFoundException) {
      throw NoPreferredPackageFound(NO_PREFERRED_PACKAGE_MSG)
    } catch (ex: PackageManagerNotFoundException) {
      throw NoPreferredPackageFound(NO_PREFERRED_PACKAGE_MSG)
    }

    return resolvedPackageName?.takeIf { it.isNotEmpty() }
      ?: throw NoPreferredPackageFound(NO_PREFERRED_PACKAGE_MSG)
  }
}
