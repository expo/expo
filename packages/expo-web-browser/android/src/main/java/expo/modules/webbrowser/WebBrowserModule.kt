package expo.modules.webbrowser

import expo.modules.core.errors.CurrentActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.text.TextUtils
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.os.bundleOf
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import androidx.core.net.toUri

private const val SERVICE_PACKAGE_KEY = "servicePackage"
private const val BROWSER_PACKAGES_KEY = "browserPackages"
private const val SERVICE_PACKAGES_KEY = "servicePackages"
private const val PREFERRED_BROWSER_PACKAGE = "preferredBrowserPackage"
private const val DEFAULT_BROWSER_PACKAGE = "defaultBrowserPackage"

private const val MODULE_NAME = "ExpoWebBrowser"

class WebBrowserModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name(MODULE_NAME)

    OnCreate {
      customTabsResolver = CustomTabsActivitiesHelper(appContext)
      connectionHelper = CustomTabsConnectionHelper(context)
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
      connectionHelper.mayInitWithUrl(resolvedPackageName, url.toUri())
      return@AsyncFunction bundleOf(
        SERVICE_PACKAGE_KEY to resolvedPackageName
      )
    }

    // throws CurrentActivityNotFoundException
    AsyncFunction<Bundle>("getCustomTabsSupportingBrowsersAsync") {
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
      val tabsIntent = createCustomTabsIntent(options).apply {
        intent.data = url.toUri()
      }

      if (!customTabsResolver.canResolveIntent(tabsIntent)) {
        throw NoMatchingActivityException()
      }

      customTabsResolver.startCustomTabs(tabsIntent, options)

      return@AsyncFunction bundleOf(
        "type" to "opened"
      )
    }
  }

  // these must be `internal` to be able to be injected in tests
  internal lateinit var customTabsResolver: CustomTabsActivitiesHelper
  internal lateinit var connectionHelper: CustomTabsConnectionHelper

  private fun createCustomTabsIntent(options: OpenBrowserOptions): CustomTabsIntent {
    val builder = CustomTabsIntent.Builder()

    val color = options.toolbarColor
    if (color != null) {
      val params = CustomTabColorSchemeParams.Builder()
        .setSecondaryToolbarColor(color)
        .build()
      builder.setDefaultColorSchemeParams(params)
    }

    val secondaryColor = options.secondaryToolbarColor
    if (secondaryColor != null) {
      val params = CustomTabColorSchemeParams.Builder()
        .setSecondaryToolbarColor(secondaryColor)
        .build()
      builder.setDefaultColorSchemeParams(params)
    }

    builder.setShowTitle(options.showTitle)

    if (options.enableDefaultShareMenuItem) {
      builder.setShareState(CustomTabsIntent.SHARE_STATE_ON)
    }

    builder.setUrlBarHidingEnabled(options.enableBarCollapsing)

    return builder.build().apply {
      val packageName = options.browserPackage
      if (!TextUtils.isEmpty(packageName)) {
        intent.setPackage(packageName)
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
    } catch (_: CurrentActivityNotFoundException) {
      throw NoPreferredPackageFound()
    } catch (_: PackageManagerNotFoundException) {
      throw NoPreferredPackageFound()
    }

    return resolvedPackageName?.takeIf { it.isNotEmpty() }
      ?: throw NoPreferredPackageFound()
  }
}
