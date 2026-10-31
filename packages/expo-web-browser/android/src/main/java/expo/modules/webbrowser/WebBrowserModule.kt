package expo.modules.webbrowser

import android.text.TextUtils
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import com.facebook.react.bridge.LifecycleEventListener
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.exception.Exceptions
import androidx.core.net.toUri
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import io.github.expo.modules.v2.react.reactContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private const val SERVICE_PACKAGE_KEY = "servicePackage"

@ExpoModule("ExpoWebBrowser")
class WebBrowserModule : Module() {
  // The connection helper is not thread-safe, so every function runs on one background thread.
  @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
  private val queue = Dispatchers.IO.limitedParallelism(1)

  private val lifecycleListener = object : LifecycleEventListener {
    override fun onHostResume() = Unit
    override fun onHostPause() = Unit
    override fun onHostDestroy() = connectionHelper.destroy()
  }

  override fun onDestroy() {
    reactContextOrNull?.removeLifecycleEventListener(lifecycleListener)
  }

  @JS
  suspend fun warmUpAsync(packageName: String?): Map<String, String> = withContext(queue) {
    val resolvedPackageName = givenOrPreferredPackageName(packageName)
    connectionHelper.warmUp(resolvedPackageName)
    mapOf(
      SERVICE_PACKAGE_KEY to resolvedPackageName
    )
  }

  @JS
  suspend fun coolDownAsync(packageName: String?): Map<String, String> = withContext(queue) {
    val resolvedPackageName = givenOrPreferredPackageName(packageName)
    if (connectionHelper.coolDown(resolvedPackageName)) {
      mapOf(
        SERVICE_PACKAGE_KEY to resolvedPackageName
      )
    } else {
      emptyMap()
    }
  }

  @JS
  suspend fun mayInitWithUrlAsync(url: String, packageName: String?): Map<String, String> = withContext(queue) {
    val resolvedPackageName = givenOrPreferredPackageName(packageName)
    connectionHelper.mayInitWithUrl(resolvedPackageName, url.toUri())
    mapOf(
      SERVICE_PACKAGE_KEY to resolvedPackageName
    )
  }

  @JS
  suspend fun getCustomTabsSupportingBrowsersAsync(): CustomTabsBrowsersResult = withContext(queue) {
    val activities = customTabsResolver.customTabsResolvingActivities
    val services = customTabsResolver.customTabsResolvingServices
    val preferredPackage = customTabsResolver.getPreferredCustomTabsResolvingActivity(activities)
    val defaultPackage = customTabsResolver.defaultCustomTabsResolvingActivity

    // It might happen, that default activity does not support Chrome Tabs. Then it will be ResolvingActivity and we don't want to return it as a result.
    val defaultCustomTabsPackage: String? = defaultPackage.takeIf { activities.contains(it) }

    CustomTabsBrowsersResult(
      browserPackages = activities,
      servicePackages = services,
      preferredBrowserPackage = preferredPackage,
      defaultBrowserPackage = defaultCustomTabsPackage
    )
  }

  @JS
  suspend fun openBrowserAsync(url: String, options: OpenBrowserOptions): OpenBrowserResult = withContext(queue) {
    val tabsIntent = createCustomTabsIntent(options).apply {
      intent.data = url.toUri()
    }

    if (!customTabsResolver.canResolveIntent(tabsIntent)) {
      throw NoMatchingActivityException()
    }

    customTabsResolver.startCustomTabs(tabsIntent, options)

    OpenBrowserResult(type = "opened")
  }

  // these must be `internal` to be able to be injected in tests
  internal val customTabsResolver: CustomTabsActivitiesHelper by lazy {
    CustomTabsActivitiesHelper { currentActivity ?: throw Exceptions.MissingActivity() }
  }
  internal val connectionHelper: CustomTabsConnectionHelper by lazy {
    reactContext.addLifecycleEventListener(lifecycleListener)
    CustomTabsConnectionHelper(androidContext)
  }

  private fun createCustomTabsIntent(options: OpenBrowserOptions): CustomTabsIntent {
    val builder = CustomTabsIntent.Builder()

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
    } catch (_: PackageManagerNotFoundException) {
      throw NoPreferredPackageFound()
    }

    return resolvedPackageName?.takeIf { it.isNotEmpty() }
      ?: throw NoPreferredPackageFound()
  }
}
