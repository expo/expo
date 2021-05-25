package expo.modules.devlauncher

import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.annotation.UiThread
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactContext
import expo.interfaces.devmenu.DevMenuManagerProviderInterface
import expo.modules.devlauncher.helpers.*
import expo.modules.devlauncher.launcher.DevLauncherActivity
import expo.modules.devlauncher.launcher.DevLauncherClientHost
import expo.modules.devlauncher.launcher.DevLauncherIntentRegistry
import expo.modules.devlauncher.launcher.DevLauncherLifecycle
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devlauncher.launcher.DevLauncherRecentlyOpenedAppsRegistry
import expo.modules.devlauncher.launcher.loaders.DevLauncherLocalAppLoader
import expo.modules.devlauncher.launcher.loaders.DevLauncherPublishedAppLoader
import expo.modules.devlauncher.launcher.loaders.DevLauncherReactNativeAppLoader
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifest
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.devlauncher.launcher.menu.DevLauncherMenuDelegate
import expo.modules.devlauncher.react.activitydelegates.DevLauncherReactActivityNOPDelegate
import expo.modules.devlauncher.react.activitydelegates.DevLauncherReactActivityRedirectDelegate
import expo.modules.updatesinterface.UpdatesInterface
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient

// Use this to load from a development server for the development client launcher UI
//  private final String DEV_LAUNCHER_HOST = "10.0.0.175:8090";
private val DEV_LAUNCHER_HOST: String? = null

private const val NEW_ACTIVITY_FLAGS = Intent.FLAG_ACTIVITY_NEW_TASK or
  Intent.FLAG_ACTIVITY_CLEAR_TASK or
  Intent.FLAG_ACTIVITY_NO_ANIMATION

private var MenuDelegateWasInitialized = false

class DevLauncherController private constructor(
  private val context: Context,
  internal val appHost: ReactNativeHost
) {
  val devClientHost = DevLauncherClientHost((context as Application), DEV_LAUNCHER_HOST)
  private val httpClient = OkHttpClient()
  private val lifecycle = DevLauncherLifecycle()
  private val recentlyOpedAppsRegistry = DevLauncherRecentlyOpenedAppsRegistry(context)
  var manifest: DevLauncherManifest? = null
    private set
  var updatesInterface: UpdatesInterface? = null
  val pendingIntentRegistry = DevLauncherIntentRegistry()
  var latestLoadedApp: Uri? = null
  var useDeveloperSupport = true

  internal enum class Mode {
    LAUNCHER, APP
  }

  internal var mode = Mode.LAUNCHER

  suspend fun loadApp(url: Uri, mainActivity: ReactActivity? = null) {
    ensureHostWasCleared(appHost, activityToBeInvalidated = mainActivity)

    val manifestParser = DevLauncherManifestParser(httpClient, url)
    val appIntent = createAppIntent()

    val appLoader = if (!manifestParser.isManifestUrl()) {
      // It's (maybe) a raw React Native bundle
      DevLauncherReactNativeAppLoader(url, appHost, context)
    } else {
      if (updatesInterface == null) {
        manifest = manifestParser.parseManifest()
        if (!manifest!!.isUsingDeveloperTool()) {
          throw Exception("expo-updates is not properly installed or integrated. In order to load published projects with this development client, follow all installation and setup instructions for both the expo-dev-client and expo-updates packages.")
        }
        DevLauncherLocalAppLoader(manifest!!, appHost, context)
      } else {
        val configuration = createUpdatesConfigurationWithUrl(url)
        val update = updatesInterface!!.loadUpdate(configuration, context) {
          manifest = DevLauncherManifest.fromJson(it.toString().reader())
          return@loadUpdate !manifest!!.isUsingDeveloperTool()
        }
        if (manifest!!.isUsingDeveloperTool()) {
          DevLauncherLocalAppLoader(manifest!!, appHost, context)
        } else {
          useDeveloperSupport = false
          val localBundlePath = update.launchAssetPath
          DevLauncherPublishedAppLoader(manifest!!, localBundlePath, appHost, context)
        }
      }
    }

    val appLoaderListener = appLoader.createOnDelegateWillBeCreatedListener()
    lifecycle.addListener(appLoaderListener)
    mode = Mode.APP

    // Note that `launch` method is a suspend one. So the execution will be stopped here until the method doesn't finish.
    if (appLoader.launch(appIntent)) {
      recentlyOpedAppsRegistry.appWasOpened(url, appLoader.getAppName())
      latestLoadedApp = url
      // Here the app will be loaded - we can remove listener here.
      lifecycle.removeListener(appLoaderListener)
    } else {
      // The app couldn't be loaded. For now, we just return to the launcher.
      mode = Mode.LAUNCHER
      manifest = null
    }
  }

  fun getRecentlyOpenedApps(): Map<String, String?> = recentlyOpedAppsRegistry.getRecentlyOpenedApps()

  fun navigateToLauncher() {
    ensureHostWasCleared(appHost)

    mode = Mode.LAUNCHER
    manifest = null
    context.applicationContext.startActivity(createLauncherIntent())
  }

  private fun handleIntent(intent: Intent?, activityToBeInvalidated: ReactActivity?): Boolean {
    intent
      ?.data
      ?.let { uri ->
        if (!isDevLauncherUrl(uri)) {
          return handleExternalIntent(intent)
        }

        val appUrl = getAppUrlFromDevLauncherUrl(uri)
        if (appUrl == null) {
          navigateToLauncher()
          return true
        }

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

  fun maybeInitDevMenuDelegate(context: ReactContext) {
    if (MenuDelegateWasInitialized) {
      return
    }
    MenuDelegateWasInitialized = true

    val devMenuManagerProvider = context
      .catalystInstance
      .nativeModules
      .find { nativeModule ->
        nativeModule is DevMenuManagerProviderInterface
      } as? DevMenuManagerProviderInterface

    val devMenuManager = devMenuManagerProvider?.getDevMenuManager() ?: return
    devMenuManager.setDelegate(DevLauncherMenuDelegate(instance))
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
    Intent(context, DevLauncherActivity::class.java)
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
        context
          .packageManager
          .getLaunchIntentForPackage(context.packageName)
      ) { "Couldn't find the launcher class." }
    } else {
      Intent(context, sLauncherClass!!)
    }.apply { addFlags(NEW_ACTIVITY_FLAGS) }

  companion object {
    private var sInstance: DevLauncherController? = null
    private var sLauncherClass: Class<*>? = null
    internal var sAdditionalPackages: List<ReactPackage>? = null

    @JvmStatic
    fun wasInitialized() = sInstance != null
    
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
    fun initialize(context: Context, appHost: ReactNativeHost, additionalPackages: List<ReactPackage>?, launcherClass: Class<*>? = null) {
      initialize(context, appHost)
      sAdditionalPackages = additionalPackages
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
