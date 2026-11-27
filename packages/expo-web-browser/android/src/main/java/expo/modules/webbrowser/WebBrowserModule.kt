package expo.modules.webbrowser

import android.content.Intent
import android.os.Bundle
import android.provider.Browser
import android.text.TextUtils
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsSession
import androidx.core.os.bundleOf
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import androidx.core.net.toUri

private const val SERVICE_PACKAGE_KEY = "servicePackage"
private const val BROWSER_PACKAGES_KEY = "browserPackages"
private const val SERVICE_PACKAGES_KEY = "servicePackages"
private const val PREFERRED_BROWSER_PACKAGE = "preferredBrowserPackage"
private const val DEFAULT_BROWSER_PACKAGE = "defaultBrowserPackage"

private const val MODULE_NAME = "ExpoWebBrowser"

private const val EXTRA_KEEP_ALIVE = "android.support.customtabs.extra.KEEP_ALIVE"

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

    AsyncFunction("openBrowserAsync") { url: String, options: OpenBrowserOptions, promise: Promise ->
      val uri = url.toUri()
      val headers = options.additionalHeaderFields
      val open = { session: CustomTabsSession? ->
        val tabsIntent = createCustomTabsIntent(options, session).apply {
          intent.data = uri
          if (headers != null) {
            intent.putExtra(
              Browser.EXTRA_HEADERS,
              Bundle().apply {
                headers.forEach { (name, value) -> putString(name, value) }
              }
            )
          }
        }

        if (!customTabsResolver.canResolveIntent(tabsIntent)) {
          throw NoMatchingActivityException()
        }

        if (options.browserPackage.isNullOrEmpty() && tabsIntent.intent.`package` == null) {
          customTabsResolver.getPreferredCustomTabsResolvingActivity(null)?.let {
            tabsIntent.intent.setPackage(it)
          }
        }

        customTabsResolver.startCustomTabs(tabsIntent, options)
        bundleOf("type" to "opened")
      }

      if (headers == null) {
        // Keep throwing synchronously when no browser can open the tab.
        val probeIntent = createCustomTabsIntent(options, null).apply { intent.data = uri }
        if (!customTabsResolver.canResolveIntent(probeIntent)) {
          throw NoMatchingActivityException()
        }

        val keepAlivePackageName = keepAlivePackageNameOrNull(options)
        if (keepAlivePackageName == null) {
          promise.resolve(open(null))
          return@AsyncFunction
        }

        // Ask the browser to keep this app alive while the tab is open. Without it, Android can
        // reclaim the app as soon as the tab covers it, and the app loses the auth redirect.
        connectionHelper.requestKeepAliveSession(keepAlivePackageName) { session ->
          try {
            promise.resolve(open(session))
          } catch (error: Exception) {
            promise.reject(error.toCodedException())
          }
        }
        return@AsyncFunction
      }
      if (!"https".equals(uri.scheme, ignoreCase = true) || uri.host.isNullOrEmpty() || uri.userInfo != null) {
        throw BrowserHeadersException("Authentication headers require an HTTPS URL without URL credentials. Update the authentication URL.")
      }
      val packageName = givenOrPreferredPackageName(options.browserPackage)
      val origin = uri.buildUpon().scheme("https").path(null).query(null).fragment(null).build()
      connectionHelper.openWithHeaders(packageName, origin, promise, open)
    }

    AsyncFunction("cancelPendingBrowserOpen") {
      connectionHelper.cancelPendingBrowserOpen()
    }
  }

  // these must be `internal` to be able to be injected in tests
  internal lateinit var customTabsResolver: CustomTabsActivitiesHelper
  internal lateinit var connectionHelper: CustomTabsConnectionHelper

  private fun createCustomTabsIntent(options: OpenBrowserOptions, session: CustomTabsSession?): CustomTabsIntent {
    val builder = CustomTabsIntent.Builder(session)

    val toolbarColor = options.toolbarColor
    val secondaryToolbarColor = options.secondaryToolbarColor
    if (toolbarColor != null || secondaryToolbarColor != null) {
      val params = CustomTabColorSchemeParams.Builder()
        .apply {
          toolbarColor?.let { setToolbarColor(it) }
          secondaryToolbarColor?.let { setSecondaryToolbarColor(it) }
        }
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
      if (session == null && !TextUtils.isEmpty(packageName)) {
        intent.setPackage(packageName)
      }
      if (session != null) {
        intent.putExtra(
          EXTRA_KEEP_ALIVE,
          Intent().setClassName(context.packageName, KeepAliveService::class.java.name)
        )
      }
    }
  }

  private fun keepAlivePackageNameOrNull(options: OpenBrowserOptions): String? {
    return try {
      givenOrPreferredPackageName(options.browserPackage)
    } catch (_: NoPreferredPackageFound) {
      null
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
    } catch (_: PackageManagerNotFoundException) {
      throw NoPreferredPackageFound()
    }

    return resolvedPackageName?.takeIf { it.isNotEmpty() }
      ?: throw NoPreferredPackageFound()
  }
}
