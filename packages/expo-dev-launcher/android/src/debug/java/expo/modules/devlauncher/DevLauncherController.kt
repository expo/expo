package expo.modules.devlauncher

import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.annotation.UiThread
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import expo.modules.devlauncher.helpers.getFieldInClassHierarchy
import expo.modules.devlauncher.helpers.runBlockingOnMainThread
import expo.modules.devlauncher.launcher.DevLauncherActivity
import expo.modules.devlauncher.launcher.DevLauncherClientHost
import expo.modules.devlauncher.launcher.DevLauncherIntentRegistry
import expo.modules.devlauncher.launcher.DevLauncherLifecycle
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devlauncher.launcher.DevLauncherRecentlyOpenedAppsRegistry
import expo.modules.devlauncher.launcher.loaders.DevLauncherExpoAppLoader
import expo.modules.devlauncher.launcher.loaders.DevLauncherReactNativeAppLoader
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.devlauncher.react.activitydelegates.DevLauncherReactActivityNOPDelegate
import expo.modules.devlauncher.react.activitydelegates.DevLauncherReactActivityRedirectDelegate
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.net.URLDecoder

// Use this to load from a development server for the development client launcher UI
//  private final String DEV_LAUNCHER_HOST = "10.0.0.175:8090";
private val DEV_LAUNCHER_HOST: String? = null

private const val NEW_ACTIVITY_FLAGS =
  Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION

class DevLauncherController private constructor(
  private val mContext: Context,
  private val mAppHost: ReactNativeHost
) {
  val devClientHost = DevLauncherClientHost((mContext as Application), DEV_LAUNCHER_HOST)
  private val httpClient = OkHttpClient()
  private val lifecycle = DevLauncherLifecycle()
  private val recentlyOpedAppsRegistry = DevLauncherRecentlyOpenedAppsRegistry(mContext)
  val pendingIntentRegistry = DevLauncherIntentRegistry()

  enum class Mode {
    LAUNCHER, APP
  }

  var mode = Mode.LAUNCHER

  suspend fun loadApp(url: String, mainActivity: ReactActivity? = null) {
    ensureHostWasCleared(mAppHost, activityToBeInvalidated = mainActivity)

    val parsedUrl = Uri.parse(url.trim())
      .buildUpon()
      .scheme("http")
      .build()
      .toString()
    val manifestParser = DevLauncherManifestParser(httpClient, parsedUrl)
    val appIntent = createAppIntent()

    val appLoader = if (!manifestParser.isManifestUrl()) {
      // It's (maybe) a raw React Native bundle
      DevLauncherReactNativeAppLoader(url, mAppHost, mContext)
    } else {
      DevLauncherExpoAppLoader(manifestParser.parseManifest(), mAppHost, mContext)
    }

    val appLoaderListener = appLoader.createOnDelegateWillBeCreatedListener()
    lifecycle.addListener(appLoaderListener)
    mode = Mode.APP

    // Note that `launch` method is a suspend one. So the execution will be stopped here until the method doesn't finish.
    if (appLoader.launch(appIntent)) {
      recentlyOpedAppsRegistry.appWasOpened(url, appLoader.getAppName())
      // Here the app will be loaded - we can remove listener here.
      lifecycle.removeListener(appLoaderListener)
    } else {
      // The app couldn't be loaded. For now, we just return to the launcher.
      mode = Mode.LAUNCHER
    }
  }

  fun getRecentlyOpenedApps(): Map<String, String?> = recentlyOpedAppsRegistry.getRecentlyOpenedApps()

  fun navigateToLauncher() {
    ensureHostWasCleared(mAppHost)

    mode = Mode.LAUNCHER
    mContext.applicationContext.startActivity(createLauncherIntent())
  }

  private fun handleIntent(intent: Intent?, activityToBeInvalidated: ReactActivity?): Boolean {
    intent
      ?.data
      ?.let { uri ->
        if ("expo-development-client" != uri.host) {
          return handleExternalIntent(intent)
        }

        if (uri.getQueryParameter("url") == null) {
          navigateToLauncher()
          return true
        }

        val appUrl = URLDecoder.decode(uri.getQueryParameter("url"), "UTF-8")
        GlobalScope.launch {
          loadApp(appUrl, activityToBeInvalidated)
        }
        return true
      }
    return false
  }

  private fun handleExternalIntent(intent: Intent): Boolean {
    if (mode == Mode.APP) {
      return false
    }

    pendingIntentRegistry.intent = intent
    return true
  }

  private fun ensureHostWasCleared(host: ReactNativeHost, activityToBeInvalidated: ReactActivity? = null) {
    if (host.hasInstance()) {
      runBlockingOnMainThread {
        clearHost(host, activityToBeInvalidated)
      }
    }
  }

  @UiThread
  private fun clearHost(host: ReactNativeHost, activityToBeInvalidated: ReactActivity?) {
    host.clear()
    activityToBeInvalidated?.let {
      invalidateActivity(it)
    }
  }

  private fun getCurrentReactActivityDelegate(activity: ReactActivity, delegateSupplierDevLauncher: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate {
    return if (mode == Mode.LAUNCHER) {
      DevLauncherReactActivityRedirectDelegate(activity, this::redirectFromStartActivity)
    } else {
      delegateSupplierDevLauncher.get()
    }
  }

  private fun redirectFromStartActivity(intent: Intent?) {
    if (!handleIntent(intent, null)) {
      navigateToLauncher()
    }
  }

  /**
   * If we try to launch a different app when the `MainActivity` is active, the app will crash
   * (NPE caused by missing activity reference in the [ReactActivityDelegate]).
   * To prevent such behavior, we need to invalidate active activity. To do it we switch
   * the inner [ReactActivityDelegate] to be a NOP object.
   */
  private fun invalidateActivity(activity: ReactActivity) {
    val field = activity::class.java.getFieldInClassHierarchy("mDelegate")
    requireNotNull(field) { "Cannot find mDelegate field in activity." }
    field.isAccessible = true
    field.set(activity, DevLauncherReactActivityNOPDelegate(activity))
  }

  private fun createLauncherIntent() =
    Intent(mContext, DevLauncherActivity::class.java)
      .apply { addFlags(NEW_ACTIVITY_FLAGS) }

  private fun createAppIntent() =
    createBasicAppIntent().apply {
      pendingIntentRegistry
        .consumePendingIntent()
        ?.let { intent ->
          action = intent.action
          data = intent.data
          intent.extras?.let {
            putExtras(it)
          }
          intent.categories?.let {
            categories.addAll(it)
          }
        }
    }

  private fun createBasicAppIntent() =
    if (sLauncherClass == null) {
      checkNotNull(
        mContext
          .packageManager
          .getLaunchIntentForPackage(mContext.packageName)
      ) { "Couldn't find the launcher class." }
    } else {
      Intent(mContext, sLauncherClass!!)
    }.apply { addFlags(NEW_ACTIVITY_FLAGS) }

  companion object {
    private var sInstance: DevLauncherController? = null
    private var sLauncherClass: Class<*>? = null

    @JvmStatic
    val instance: DevLauncherController
      get() = checkNotNull(sInstance) {
        "DevelopmentClientController.getInstance() was called before the module was initialized"
      }

    @JvmStatic
    fun initialize(context: Context, appHost: ReactNativeHost) {
      check(sInstance == null) { "DevelopmentClientController was initialized." }
      sInstance = DevLauncherController(context, appHost)
    }

    @JvmStatic
    fun initialize(context: Context, appHost: ReactNativeHost, launcherClass: Class<*>) {
      initialize(context, appHost)
      sLauncherClass = launcherClass
    }

    @JvmStatic
    fun wrapReactActivityDelegate(activity: ReactActivity, devLauncherReactActivityDelegateSupplier: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate {
      instance.lifecycle.delegateWillBeCreated(activity)
      return instance.getCurrentReactActivityDelegate(activity, devLauncherReactActivityDelegateSupplier)
    }

    @JvmStatic
    fun tryToHandleIntent(activity: ReactActivity, intent: Intent): Boolean {
      return instance.handleIntent(intent, activityToBeInvalidated = activity)
    }
  }
}
