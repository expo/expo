package expo.modules.devlauncher

import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.annotation.UiThread
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactContext
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.helpers.DevLauncherMetadataHelper
import expo.modules.devlauncher.helpers.DevLauncherUrl
import expo.modules.devlauncher.helpers.getFieldInClassHierarchy
import expo.modules.devlauncher.helpers.hasUrlQueryParam
import expo.modules.devlauncher.helpers.isDevLauncherUrl
import expo.modules.devlauncher.helpers.runBlockingOnMainThread
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.koin.DevLauncherKoinContext
import expo.modules.devlauncher.koin.devLauncherKoin
import expo.modules.devlauncher.koin.optInject
import expo.modules.devlauncher.launcher.DevLauncherActivity
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.DevLauncherIntentRegistryInterface
import expo.modules.devlauncher.launcher.DevLauncherLifecycle
import expo.modules.devlauncher.launcher.DevLauncherNetworkInterceptor
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devlauncher.launcher.DevLauncherReactHost
import expo.modules.devlauncher.launcher.DevLauncherReactNativeHost
import expo.modules.devlauncher.launcher.DevLauncherRecentlyOpenedAppsRegistry
import expo.modules.devlauncher.launcher.errors.DevLauncherAppError
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivity
import expo.modules.devlauncher.launcher.errors.DevLauncherUncaughtExceptionHandler
import expo.modules.devlauncher.launcher.loaders.DevLauncherAppLoaderFactoryInterface
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.devlauncher.react.activitydelegates.DevLauncherReactActivityNOPDelegate
import expo.modules.devlauncher.react.activitydelegates.DevLauncherReactActivityRedirectDelegate
import expo.modules.devlauncher.tests.DevLauncherTestInterceptor
import expo.modules.devmenu.DevMenuManager
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import org.koin.core.component.get
import org.koin.core.component.inject
import org.koin.dsl.module

// Use this to load from a development server for the development client launcher UI
// private val DEV_LAUNCHER_HOST = "10.0.0.175:8090";
private val DEV_LAUNCHER_HOST: String? = null

private const val NEW_ACTIVITY_FLAGS = Intent.FLAG_ACTIVITY_NEW_TASK or
  Intent.FLAG_ACTIVITY_CLEAR_TASK or
  Intent.FLAG_ACTIVITY_NO_ANIMATION

class DevLauncherController private constructor() :
  DevLauncherKoinComponent, DevLauncherControllerInterface {
  private val context: Context by lazy {
    DevLauncherKoinContext.app.koin.get()
  }
  override val appHost: ReactHostWrapper by inject()
  private val httpClient: OkHttpClient by inject()
  private val lifecycle: DevLauncherLifecycle by inject()
  private val pendingIntentRegistry: DevLauncherIntentRegistryInterface by inject()
  private val installationIDHelper: DevLauncherInstallationIDHelper by inject()
  val internalUpdatesInterface: UpdatesInterface? by optInject()
  var devMenuManager: DevMenuManager = DevMenuManager
  override var updatesInterface: UpdatesInterface?
    get() = internalUpdatesInterface
    set(value) = DevLauncherKoinContext.app.koin.loadModules(
      listOf(
        module {
          single { value }
        }
      )
    )
  override val coroutineScope = CoroutineScope(Dispatchers.Default)

  override val devClientHost by lazy {
    ReactHostWrapper(
      reactNativeHost = DevLauncherReactNativeHost(context as Application, DEV_LAUNCHER_HOST),
      reactHostProvider = { DevLauncherReactHost.create(context as Application, DEV_LAUNCHER_HOST) }
    )
  }

  private val recentlyOpedAppsRegistry = DevLauncherRecentlyOpenedAppsRegistry(context)
  override var manifest: Manifest? = null
    private set
  override var manifestURL: Uri? = null
    private set
  override var latestLoadedApp: Uri? = null
  override var useDeveloperSupport = true
  var canLaunchDevMenuOnStart = false

  enum class Mode {
    LAUNCHER,
    APP
  }

  override var mode = Mode.LAUNCHER

  private var appIsLoading = false

  private var networkInterceptor: DevLauncherNetworkInterceptor? = null
  private var pendingIntentExtras: Bundle? = null

  private fun isEASUpdateURL(url: Uri): Boolean {
    return url.host.equals("u.expo.dev") || url.host.equals("staging-u.expo.dev")
  }

  override fun onRequestRelaunch() {
    val latestLoadedApp = latestLoadedApp ?: return
    coroutineScope.launch {
      loadApp(
        latestLoadedApp,
        appHost.currentReactContext?.currentActivity as? ReactActivity?
      )
    }
  }

  override suspend fun loadApp(url: Uri, projectUrl: Uri?, mainActivity: ReactActivity?) {
    synchronized(this) {
      if (appIsLoading) {
        return
      }
      appIsLoading = true
    }

    try {
      ensureHostWasCleared(appHost, activityToBeInvalidated = mainActivity)
      val devLauncherUrl = DevLauncherUrl(url)
      val parsedUrl = devLauncherUrl.url
      var parsedProjectUrl = projectUrl ?: url

      val isEASUpdate = isEASUpdateURL(url)

      // default to the EXPO_UPDATE_URL value configured in AndroidManifest.xml when project url is unspecified for an EAS update
      if (isEASUpdate && projectUrl == null) {
        val projectUrlString = getMetadataValue(context, "expo.modules.updates.EXPO_UPDATE_URL")
        parsedProjectUrl = Uri.parse(projectUrlString)
      }

      val manifestParser = DevLauncherManifestParser(httpClient, parsedUrl, installationIDHelper.getOrCreateInstallationID(context))
      val appIntent = createAppIntent()

      DevLauncherKoinContext.app.koin.getOrNull<UpdatesInterface>()?.reset()

      val appLoaderFactory = get<DevLauncherAppLoaderFactoryInterface>()
      val appLoader = appLoaderFactory.createAppLoader(parsedUrl, parsedProjectUrl, manifestParser)
      useDeveloperSupport = appLoaderFactory.shouldUseDeveloperSupport()
      manifest = appLoaderFactory.getManifest()
      manifestURL = parsedUrl

      setupDevMenu(url.toString())

      val appLoaderListener = appLoader.createOnDelegateWillBeCreatedListener()
      lifecycle.addListener(appLoaderListener)
      mode = Mode.APP

      // Note that `launch` method is a suspend one. So the execution will be stopped here until the method doesn't finish.
      if (appLoader.launch(appIntent)) {
        recentlyOpedAppsRegistry.appWasOpened(parsedUrl.toString(), devLauncherUrl.queryParams, manifest)
        latestLoadedApp = parsedUrl
        // Here the app will be loaded - we can remove listener here.
        lifecycle.removeListener(appLoaderListener)
      } else {
        // The app couldn't be loaded. For now, we just return to the launcher.
        mode = Mode.LAUNCHER
        manifest = null
        manifestURL = null
        invalidateDevMenu()
      }
    } catch (e: Exception) {
      synchronized(this) {
        appIsLoading = false
      }
      throw e
    }
  }

  override suspend fun loadApp(url: Uri, mainActivity: ReactActivity?) {
    loadApp(url, null, mainActivity)
  }

  override fun onAppLoaded(context: ReactContext) {
    synchronized(this) {
      appIsLoading = false
    }
    manifestURL?.let {
      runBlockingOnMainThread {
        networkInterceptor = DevLauncherNetworkInterceptor(it)
      }
    }
  }

  override fun onAppLoadedWithError() {
    synchronized(this) {
      appIsLoading = false
    }
  }

  override fun getRecentlyOpenedApps(): List<DevLauncherAppEntry> = recentlyOpedAppsRegistry.getRecentlyOpenedApps()

  override fun clearRecentlyOpenedApps() {
    recentlyOpedAppsRegistry.clearRegistry()
  }

  override fun navigateToLauncher() {
    ensureHostWasCleared(appHost)
    synchronized(this) {
      appIsLoading = false
    }

    mode = Mode.LAUNCHER
    manifest = null
    manifestURL = null

    invalidateDevMenu()

    context.applicationContext.startActivity(createLauncherIntent())
  }

  override fun handleIntent(intent: Intent?, activityToBeInvalidated: ReactActivity?): Boolean {
    intent
      ?.data
      ?.let { uri ->
        // used by appetize for snack
        if (intent.getBooleanExtra("EXDevMenuDisableAutoLaunch", false)) {
          canLaunchDevMenuOnStart = false
          this.devMenuManager.setCanLaunchDevMenuOnStart(canLaunchDevMenuOnStart)
        }

        if (!isDevLauncherUrl(uri)) {
          return handleExternalIntent(intent)
        }

        if (!hasUrlQueryParam(uri)) {
          // edge case: this is a dev launcher url but it does not specify what url to open
          // fallback to navigating to the launcher home screen
          navigateToLauncher()
          return true
        }

        coroutineScope.launch {
          try {
            pendingIntentRegistry.intent = intent
            loadApp(uri, activityToBeInvalidated)
          } catch (e: Throwable) {
            DevLauncherErrorActivity.showFatalError(context, DevLauncherAppError(e.message, e))
          }
        }
        return true
      }

    intent?.let {
      // If the app is already open or the intent is not a main intent, we don't want to handle it.
      if (mode == Mode.APP || intent.action != Intent.ACTION_MAIN) {
        return@let
      }

      val shouldTryToLaunchLastOpenedBundle = getMetadataValue(context, "DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE", "true").toBoolean()
      val lastOpenedApp = recentlyOpedAppsRegistry.getMostRecentApp()
      if (shouldTryToLaunchLastOpenedBundle && lastOpenedApp != null) {
        coroutineScope.launch {
          try {
            loadApp(Uri.parse(lastOpenedApp.url), activityToBeInvalidated)
          } catch (e: Throwable) {
            navigateToLauncher()
          }
        }
        return true
      }
      return handleExternalIntent(it)
    }

    return false
  }

  private fun handleExternalIntent(intent: Intent): Boolean {
    // Always store the intent extras even if we don't set the pending intent.
    pendingIntentExtras = intent.extras
    if (mode != Mode.APP && intent.action != Intent.ACTION_MAIN) {
      pendingIntentRegistry.intent = intent
    }

    return false
  }

  private fun ensureHostWasCleared(host: ReactHostWrapper, activityToBeInvalidated: ReactActivity? = null) {
    if (host.hasInstance) {
      runBlockingOnMainThread {
        networkInterceptor?.close()
        networkInterceptor = null
        clearHost(host, activityToBeInvalidated)
      }
    }
  }

  private fun setupDevMenu(launchUrl: String) {
    devMenuManager.currentManifest = manifest
    devMenuManager.currentManifestURL = manifestURL.toString()
    devMenuManager.launchUrl = launchUrl
  }

  private fun invalidateDevMenu() {
    devMenuManager.currentManifest = null
    devMenuManager.currentManifestURL = null
    devMenuManager.launchUrl = null
  }

  @UiThread
  private fun clearHost(host: ReactHostWrapper, activityToBeInvalidated: ReactActivity?) {
    host.destroy()
    activityToBeInvalidated?.let {
      invalidateActivity(it)
    }
  }

  override fun getCurrentReactActivityDelegate(activity: ReactActivity, delegateSupplierDevLauncher: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate {
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
        } ?: run {
          // If no pending intent is available, use the extras from the intent that was used to launch the app.
          pendingIntentExtras?.let {
            putExtras(it)
          }
        }

        // Clear the pending intent extras after using them.
        pendingIntentExtras = null
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
    private var sErrorHandlerWasInitialized = false
    private var sLauncherClass: Class<*>? = null
    internal var sAdditionalPackages: List<ReactPackage>? = null

    @JvmStatic
    fun getMetadataValue(context: Context, key: String, defaultValue: String = "") =
      DevLauncherMetadataHelper.getMetadataValue(context, key, defaultValue)

    @JvmStatic
    fun wasInitialized() =
      DevLauncherKoinContext.app.koin.getOrNull<DevLauncherControllerInterface>() != null

    @JvmStatic
    val instance: DevLauncherControllerInterface
      get() = checkNotNull(
        DevLauncherKoinContext.app.koin.getOrNull()
      ) {
        "DevelopmentClientController.getInstance() was called before the module was initialized"
      }

    @JvmStatic
    internal fun initialize(context: Context, reactHost: ReactHostWrapper) {
      val testInterceptor = DevLauncherKoinContext.app.koin.get<DevLauncherTestInterceptor>()
      if (!testInterceptor.allowReinitialization()) {
        check(!wasInitialized()) { "DevelopmentClientController was initialized." }
      }
      DevLauncherKoinContext.app.koin.loadModules(
        listOf(
          module {
            single { context }
            single { reactHost }
          }
        ),
        allowOverride = true
      )

      val controller = DevLauncherController()
      DevLauncherKoinContext.app.koin.declare<DevLauncherControllerInterface>(controller)

      if (!sErrorHandlerWasInitialized && context is Application) {
        val handler = DevLauncherUncaughtExceptionHandler(
          controller,
          context,
          Thread.getDefaultUncaughtExceptionHandler()
        )
        Thread.setDefaultUncaughtExceptionHandler(handler)
        sErrorHandlerWasInitialized = true
      }
    }

    @JvmStatic
    fun initialize(context: Context, reactHost: ReactHostWrapper, launcherClass: Class<*>? = null) {
      initialize(context, reactHost)
      sLauncherClass = launcherClass
    }

    @JvmStatic
    fun initialize(reactApplication: ReactApplication, additionalPackages: List<ReactPackage>? = null, launcherClass: Class<*>? = null) {
      initialize(reactApplication as Context, ReactHostWrapper(reactApplication.reactNativeHost, { reactApplication.reactHost }))
      sAdditionalPackages = additionalPackages
      sLauncherClass = launcherClass
    }

    @JvmStatic
    fun wrapReactActivityDelegate(activity: ReactActivity, devLauncherReactActivityDelegateSupplier: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate {
      devLauncherKoin()
        .get<DevLauncherLifecycle>()
        .delegateWillBeCreated(activity)

      return devLauncherKoin()
        .get<DevLauncherControllerInterface>()
        .getCurrentReactActivityDelegate(activity, devLauncherReactActivityDelegateSupplier)
    }

    @JvmStatic
    fun tryToHandleIntent(activity: ReactActivity, intent: Intent): Boolean {
      return devLauncherKoin()
        .get<DevLauncherControllerInterface>()
        .handleIntent(intent, activityToBeInvalidated = activity)
    }
  }
}
