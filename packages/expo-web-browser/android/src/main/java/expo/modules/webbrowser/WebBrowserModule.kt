package expo.modules.webbrowser

import expo.modules.core.errors.CurrentActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.TextUtils
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.os.bundleOf
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val SERVICE_PACKAGE_KEY = "servicePackage"
private const val BROWSER_PACKAGES_KEY = "browserPackages"
private const val SERVICE_PACKAGES_KEY = "servicePackages"
private const val PREFERRED_BROWSER_PACKAGE = "preferredBrowserPackage"
private const val DEFAULT_BROWSER_PACKAGE = "defaultBrowserPackage"

private const val MODULE_NAME = "ExpoWebBrowser"

class WebBrowserModule : Module() {
  override fun definition() = ModuleDefinition {
    Name(MODULE_NAME)

    OnCreate {
      customTabsResolver = CustomTabsActivitiesHelper(appContext.activityProvider)
      connectionHelper = CustomTabsConnectionHelper(
        requireNotNull(appContext.reactContext) {
          "Cannot initialize WebBrowser, ReactContext is null"
        }
      )
    }

    OnActivityDestroys {
      connectionHelper.destroy()
    }

    AsyncFunction("warmUpAsync") { packageName: String? ->
      val resolvedPackageName = givenOrPreferredPackageName(packageName)
      connectionHelper.warmUp(resolvedPackageName)
      return@AsyncFunction bundleOf(
        SERVICE_PACKAGE_KEY to resolvedPackageName
      )
    }

    AsyncFunction("coolDownAsync") { packageName: String? ->
      val resolvedPackageName = givenOrPreferredPackageName(packageName)
      val result = if (connectionHelper.coolDown(resolvedPackageName)) {
        bundleOf(
          SERVICE_PACKAGE_KEY to resolvedPackageName
        )
      } else {
        Bundle()
      }
      return@AsyncFunction result
    }

    AsyncFunction("mayInitWithUrlAsync") { url: String, packageName: String? ->
      val resolvedPackageName = givenOrPreferredPackageName(packageName)
      connectionHelper.mayInitWithUrl(resolvedPackageName, Uri.parse(url))
      return@AsyncFunction bundleOf(
        SERVICE_PACKAGE_KEY to resolvedPackageName
      )
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

      return@AsyncFunction bundleOf(
        "type" to "opened"
      )
    }
  }

  // these must be `internal` to be able to be injected in tests
  internal lateinit var customTabsResolver: CustomTabsActivitiesHelper
  internal lateinit var connectionHelper: CustomTabsConnectionHelper

  private fun createCustomTabsIntent(options: OpenBrowserOptions): Intent {
    val builder = CustomTabsIntent.Builder()

    val color = options.toolbarColor
    if (color != null) {
      builder.setToolbarColor(color)
    }

    val secondaryColor = options.secondaryToolbarColor
    if (secondaryColor != null) {
      builder.setSecondaryToolbarColor(secondaryColor)
    }

    builder.setShowTitle(options.showTitle)

    if (options.enableDefaultShareMenuItem) {
      builder.addDefaultShareMenuItem()
    }

    return builder.build().intent.apply {
      // We cannot use the builder's method enableUrlBarHiding, because there is
      // no corresponding disable method and some browsers enable it by default.
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
      throw NoPreferredPackageFound()
    } catch (ex: PackageManagerNotFoundException) {
      throw NoPreferredPackageFound()
    }

    return resolvedPackageName?.takeIf { it.isNotEmpty() }
      ?: throw NoPreferredPackageFound()
  }
}
