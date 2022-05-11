package expo.modules.webbrowser

import expo.modules.core.errors.CurrentActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.text.TextUtils
import androidx.browser.customtabs.CustomTabsIntent
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
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
private const val MODULE_NAME = "ExpoWebBrowser"
private const val SHOW_TITLE_KEY = "showTitle"
private const val ENABLE_BAR_COLLAPSING_KEY = "enableBarCollapsing"
private const val NO_PREFERRED_PACKAGE_MSG = "Cannot determine preferred package without satisfying it."

class WebBrowserModule : Module() {
  override fun definition() = ModuleDefinition {
    Name(MODULE_NAME)

    OnCreate {
      val moduleRegistry = this@WebBrowserModule.appContext.legacyModuleRegistry
      customTabsResolver = moduleRegistry.getModule(CustomTabsActivitiesHelper::class.java)
      connectionHelper = moduleRegistry.getModule(CustomTabsConnectionHelper::class.java)
    }

    AsyncFunction("warmUpAsync") { packageName: String ->
        val resolvedPackageName = givenOrPreferredPackageName(packageName)
        connectionHelper.warmUp(resolvedPackageName)
        val result = Bundle().apply {
          putString(SERVICE_PACKAGE_KEY, resolvedPackageName)
        }
        return@AsyncFunction result
    }

    AsyncFunction("coolDownAsync") { packageName: String ->
      val resolvedPackageName = givenOrPreferredPackageName(packageName)
      val result = Bundle().apply {
          if (connectionHelper.coolDown(resolvedPackageName)) {
            putString(SERVICE_PACKAGE_KEY, resolvedPackageName)
          }
        }
      return@AsyncFunction result
    }

    AsyncFunction("mayInitWithUrlAsync") { url: String, packageName: String ->
      val resolvedPackageName = givenOrPreferredPackageName(packageName)
      connectionHelper.mayInitWithUrl(resolvedPackageName, Uri.parse(url))
      val result = Bundle().apply {
        putString(SERVICE_PACKAGE_KEY, resolvedPackageName)
      }
      return@AsyncFunction result
    }

    // throws CurrentActivityNotFoundException
    AsyncFunction("getCustomTabsSupportingBrowsersAsync") {
      val activities = customTabsResolver.customTabsResolvingActivities
      val services = customTabsResolver.customTabsResolvingServices
      val preferredPackage = customTabsResolver.getPreferredCustomTabsResolvingActivity(activities)
      val defaultPackage = customTabsResolver.defaultCustomTabsResolvingActivity

      // It might happen, that default activity does not support Chrome Tabs. Then it will be ResolvingActivity and we don't want to return it as a result.
      val defaultCustomTabsPackage: String? = defaultPackage.takeIf { activities.contains(it) }

      return@AsyncFunction Bundle().apply {
        putStringArrayList(BROWSER_PACKAGES_KEY, activities)
        putStringArrayList(SERVICE_PACKAGES_KEY, services)
        putString(PREFERRED_BROWSER_PACKAGE, preferredPackage)
        putString(DEFAULT_BROWSER_PACKAGE, defaultCustomTabsPackage)
      }
    }

    // throws CurrentActivityNotFoundException
    AsyncFunction("openBrowserAsync") { url: String, options: OpenBrowserOptions ->
      val intent = createCustomTabsIntent(options).apply {
        data = Uri.parse(url)
      }

      if (!customTabsResolver.canResolveIntent(intent)) {
        throw NoMatchingActivityException()
      }

      customTabsResolver.startCustomTabs(intent)

      return@AsyncFunction Bundle().apply {
            putString("type", "opened")
          }
    }
  }

  private lateinit var customTabsResolver: CustomTabsActivitiesHelper
  private lateinit var connectionHelper: CustomTabsConnectionHelper

  private fun createCustomTabsIntent(options: OpenBrowserOptions): Intent {
    val builder = CustomTabsIntent.Builder()
    val color = options.toolbarColor
    val secondaryColor = options.secondaryToolbarColor

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

    builder.setShowTitle(options.showTitle)

    if (options.enableDefaultShareMenuItem) {
      builder.addDefaultShareMenuItem()
    }

    return builder.build().intent.apply {
      // We cannot use builder's method enableUrlBarHiding, because there is
      // no corresponding disable method and some browsers enables it by default.
      putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, options.enableBarCollapsing)

      val packageName = options.browserPackage
      if (!TextUtils.isEmpty(packageName)) {
        setPackage(packageName)
      }

      if (options.shouldCreateTask) {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        if (!options.showInRecents) {
          addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
          addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
        }
      }
    }
  }

  /**
   * @throws NoPreferredPackageFound
   */
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
