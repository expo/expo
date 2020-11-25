package expo.modules.developmentclient

import android.app.Application
import android.content.Context
import android.content.Intent
import androidx.annotation.UiThread
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import expo.modules.developmentclient.helpers.getFieldInClassHierarchy
import expo.modules.developmentclient.helpers.runBlockingOnMainThread
import expo.modules.developmentclient.launcher.DevelopmentClientActivity
import expo.modules.developmentclient.launcher.DevelopmentClientHost
import expo.modules.developmentclient.launcher.DevelopmentClientIntentRegistry
import expo.modules.developmentclient.launcher.DevelopmentClientLifecycle
import expo.modules.developmentclient.launcher.ReactActivityDelegateSupplier
import expo.modules.developmentclient.launcher.DevelopmentClientRecentlyOpenedAppsRegistry
import expo.modules.developmentclient.launcher.loaders.DevelopmentClientExpoAppLoader
import expo.modules.developmentclient.launcher.loaders.DevelopmentClientReactNativeAppLoader
import expo.modules.developmentclient.launcher.manifest.DevelopmentClientManifestParser
import expo.modules.developmentclient.react.activitydelegates.DevelopmentClientReactActivityNOPDelegate
import expo.modules.developmentclient.react.activitydelegates.DevelopmentClientReactActivityRedirectDelegate
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.net.URLDecoder

// Use this to load from a development server for the development client launcher UI
//  private final String DEV_LAUNCHER_HOST = "10.0.0.175:8090";
private val DEV_LAUNCHER_HOST: String? = null

private const val NEW_ACTIVITY_FLAGS =
  Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION

class DevelopmentClientController private constructor(
  private val mContext: Context,
  private val mAppHost: ReactNativeHost
) {
  val devClientHost = DevelopmentClientHost((mContext as Application), DEV_LAUNCHER_HOST)
  private val httpClient = OkHttpClient()
  private val lifecycle = DevelopmentClientLifecycle()
  private val recentlyOpedAppsRegistry = DevelopmentClientRecentlyOpenedAppsRegistry(mContext)
  val pendingIntentRegistry = DevelopmentClientIntentRegistry()

  enum class Mode {
    LAUNCHER, APP
  }

  var mode = Mode.LAUNCHER

  suspend fun loadApp(url: String, mainActivity: ReactActivity? = null) {
    ensureHostWasCleared(mAppHost, activityToBeInvalidated = mainActivity)

    val parsedUrl = url
      .trim()
      .replace("exp", "http")
    val manifestParser = DevelopmentClientManifestParser(httpClient, parsedUrl)
    val appIntent = createAppIntent()

    val appLoader = if (!manifestParser.isManifestUrl()) {
      // It's (maybe) a raw React Native bundle
      DevelopmentClientReactNativeAppLoader(url, mAppHost, mContext)
    } else {
      DevelopmentClientExpoAppLoader(manifestParser.parseManifest(), mAppHost, mContext)
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

  private fun getCurrentReactActivityDelegate(activity: ReactActivity, delegateSupplier: ReactActivityDelegateSupplier): ReactActivityDelegate {
    return if (mode == Mode.LAUNCHER) {
      DevelopmentClientReactActivityRedirectDelegate(activity, this::redirectFromStartActivity)
    } else {
      delegateSupplier.get()
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
    field.set(activity, DevelopmentClientReactActivityNOPDelegate(activity))
  }

  private fun createLauncherIntent() =
    Intent(mContext, DevelopmentClientActivity::class.java)
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
    private var sInstance: DevelopmentClientController? = null
    private var sLauncherClass: Class<*>? = null

    @JvmStatic
    val instance: DevelopmentClientController
      get() = checkNotNull(sInstance) {
        "DevelopmentClientController.getInstance() was called before the module was initialized"
      }

    @JvmStatic
    fun initialize(context: Context, appHost: ReactNativeHost) {
      check(sInstance == null) { "DevelopmentClientController was initialized." }
      sInstance = DevelopmentClientController(context, appHost)
    }

    @JvmStatic
    fun initialize(context: Context, appHost: ReactNativeHost, launcherClass: Class<*>) {
      initialize(context, appHost)
      sLauncherClass = launcherClass
    }

    @JvmStatic
    fun wrapReactActivityDelegate(activity: ReactActivity, reactActivityDelegateSupplier: ReactActivityDelegateSupplier): ReactActivityDelegate {
      instance.lifecycle.delegateWillBeCreated(activity)
      return instance.getCurrentReactActivityDelegate(activity, reactActivityDelegateSupplier)
    }

    @JvmStatic
    fun tryToHandleIntent(activity: ReactActivity, intent: Intent): Boolean {
      return instance.handleIntent(intent, activityToBeInvalidated = activity)
    }
  }
}
