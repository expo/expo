package expo.modules.devlauncher

import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.annotation.UiThread
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.core.net.toUri
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.OkHttpClientProvider
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.helpers.DevLauncherMetadataHelper
import expo.modules.devlauncher.helpers.getFieldInClassHierarchy
import expo.modules.devlauncher.helpers.hasUrlQueryParam
import expo.modules.devlauncher.helpers.isDevLauncherUrl
import expo.modules.devlauncher.helpers.runBlockingOnMainThread
import expo.modules.devlauncher.launcher.DevLauncherActivity
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.DevLauncherIntentRegistry
import expo.modules.devlauncher.launcher.DevLauncherLifecycle
import expo.modules.devlauncher.launcher.DevLauncherNetworkInterceptor
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devlauncher.launcher.DevLauncherRecentlyOpenedAppsRegistry
import expo.modules.devlauncher.launcher.errors.DevLauncherAppError
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivity
import expo.modules.devlauncher.launcher.errors.DevLauncherUncaughtExceptionHandler
import expo.modules.devlauncher.launcher.loaders.DevLauncherAppLoader
import expo.modules.devlauncher.launcher.loaders.DevLauncherEmbeddedAppLoader
import expo.modules.devlauncher.launcher.loaders.createAppLoader
import expo.modules.devlauncher.react.activitydelegates.DevLauncherReactActivityNOPDelegate
import expo.modules.devlauncher.react.activitydelegates.DevLauncherReactActivityRedirectDelegate
import expo.modules.devlauncher.services.DependencyInjection
import expo.modules.kotlin.weak
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesDevLauncherInterface
import expo.modules.updatesinterface.UpdatesInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

private const val NEW_ACTIVITY_FLAGS = Intent.FLAG_ACTIVITY_NEW_TASK or
  Intent.FLAG_ACTIVITY_CLEAR_TASK or
  Intent.FLAG_ACTIVITY_NO_ANIMATION

class DevLauncherController private constructor(
  context: Context,
  override val appHost: ReactHost
) : DevLauncherControllerInterface {
  private val contextHolder = context.weak()
  val context: Context
    get() = checkNotNull(contextHolder.get()) {
      "DevLauncherController's context reference is null"
    }
  val nullableContext: Context?
    get() = contextHolder.get()

  val httpClient by lazy { OkHttpClientProvider.getOkHttpClient() }
  val lifecycle by lazy { DevLauncherLifecycle() }
  private val pendingIntentRegistry by lazy { DevLauncherIntentRegistry() }
  private val installationIDHelper by lazy { DevLauncherInstallationIDHelper() }

  private var _updatesInterface: UpdatesInterface? = null
  override var updatesInterface: UpdatesInterface?
    get() = _updatesInterface
    set(value) = run {
      if (value != null) {
        DependencyInjection.appService?.setUpUpdateInterface(value, context)
      }
      _updatesInterface = value
    }

  override val coroutineScope = CoroutineScope(Dispatchers.Default)

  private val recentlyOpedAppsRegistry = DevLauncherRecentlyOpenedAppsRegistry(context)
  override var manifest: Manifest? = null
    private set

  override var manifestURL: Uri? = null
    private set

  override var latestLoadedApp: Uri? = null
  override var useDeveloperSupport = true

  enum class Mode {
    LAUNCHER,
    APP
  }

  override var mode = Mode.LAUNCHER

  private var appIsLoading = false

  private val _isLoadingToBundler = mutableStateOf(false)
  val isLoadingToBundler: State<Boolean>
    get() = _isLoadingToBundler

  private var networkInterceptor: DevLauncherNetworkInterceptor? = null
  private var pendingIntentExtras: Bundle? = null

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
      _isLoadingToBundler.value = true
    }

    try {
      ensureHostWasCleared(appHost, activityToBeInvalidated = mainActivity)
      (updatesInterface as UpdatesDevLauncherInterface?)?.reset()

      val result = createAppLoader(url, projectUrl, context, appHost, updatesInterface, this, installationIDHelper)

      useDeveloperSupport = result.useDeveloperSupport
      manifest = result.manifest
      manifestURL = result.manifestURL

      if (url.toString().contains("disableOnboarding=1") || manifestURL?.toString()?.contains("disableOnboarding=1") == true) {
        DependencyInjection.devMenuPreferences?.isOnboardingFinished = true
      }

      if (launchAppLoader(result.appLoader)) {
        latestLoadedApp = result.resolvedUrl
        result.devLauncherUrl?.let { devLauncherUrl ->
          recentlyOpedAppsRegistry.appWasOpened(devLauncherUrl.url.toString(), devLauncherUrl.queryParams, manifest)
        }
      } else {
        // The app couldn't be loaded. For now, we just return to the launcher.
        mode = Mode.LAUNCHER
        manifest = null
        manifestURL = null
      }
    } catch (e: Exception) {
      synchronized(this) {
        appIsLoading = false
        _isLoadingToBundler.value = false
      }
      throw e
    }
  }

  private suspend fun launchAppLoader(appLoader: DevLauncherAppLoader): Boolean {
    val listener = appLoader.createOnDelegateWillBeCreatedListener()
    lifecycle.addListener(listener)
    mode = Mode.APP
    _isLoadingToBundler.value = false

    val launched = appLoader.launch(createAppIntent())
    if (launched) {
      lifecycle.removeListener(listener)
    }
    return launched
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

  fun hasEmbeddedBundle(): Boolean {
    val enabled = getMetadataValue(context, "EXDevClientEmbeddedBundle", "false").toBoolean()
    if (!enabled) {
      return false
    }

    return runCatching {
      context.assets.open("index.android.bundle").use { true }
    }.getOrDefault(false)
  }

  suspend fun loadEmbeddedBundle(mainActivity: ReactActivity? = null) {
    synchronized(this) {
      if (appIsLoading) {
        return
      }
      appIsLoading = true
    }

    try {
      ensureHostWasCleared(appHost, activityToBeInvalidated = mainActivity)

      val appIntent = createAppIntent()
      val appLoader = DevLauncherEmbeddedAppLoader(appHost, context, this)
      useDeveloperSupport = false
      manifest = null
      manifestURL = null

      val appLoaderListener = appLoader.createOnDelegateWillBeCreatedListener()
      lifecycle.addListener(appLoaderListener)
      mode = Mode.APP

      if (appLoader.launch(appIntent)) {
        latestLoadedApp = null
        lifecycle.removeListener(appLoaderListener)
      } else {
        mode = Mode.LAUNCHER
      }
    } catch (e: Exception) {
      mode = Mode.LAUNCHER
      throw e
    } finally {
      synchronized(this) {
        appIsLoading = false
      }
    }
  }

  override fun getRecentlyOpenedApps(): List<DevLauncherAppEntry> =
    recentlyOpedAppsRegistry.getRecentlyOpenedApps()

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

    context.applicationContext.startActivity(createLauncherIntent())
  }

  fun launchDefaultUrlOrNavigateToLauncher(scope: CoroutineScope, defaultLaunchUrl: Uri, activityToBeInvalidated: ReactActivity?) {
    scope.launch {
      try {
        loadApp(defaultLaunchUrl, activityToBeInvalidated)
      } catch (_: Throwable) {
        navigateToLauncher()
      }
    }
  }

  override fun handleIntent(intent: Intent?, activityToBeInvalidated: ReactActivity?): Boolean {
    val defaultLaunchUrlValue = getMetadataValue(context, "DEV_CLIENT_DEFAULT_LAUNCHER_URL", "")
    val defaultLaunchUrl = defaultLaunchUrlValue.toUri()
    val useDefaultLaunchUrlFallback = defaultLaunchUrlValue.isNotEmpty()
    intent
      ?.data
      ?.let { uri ->
        // used by appetize for snack
        if (intent.getBooleanExtra("EXDevMenuDisableAutoLaunch", false)) {
          DependencyInjection.devMenuPreferences?.showsAtLaunch = false
          DependencyInjection.devMenuPreferences?.isOnboardingFinished = true
        }

        if (!isDevLauncherUrl(uri)) {
          return handleExternalIntent(intent)
        }

        if (!hasUrlQueryParam(uri)) {
          // edge case: this is a dev launcher url, but it does not specify what url to open
          // fallback to navigating to the launcher home screen
          if (useDefaultLaunchUrlFallback) {
            launchDefaultUrlOrNavigateToLauncher(coroutineScope, defaultLaunchUrl, activityToBeInvalidated)
            return true
          }
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

      val shouldTryToLaunchLastOpenedBundle =
        DependencyInjection.devMenuPreferences?.tryToLaunchLastBundle ?: true
      val lastOpenedApp = recentlyOpedAppsRegistry.getMostRecentApp()
      if (shouldTryToLaunchLastOpenedBundle && lastOpenedApp != null) {
        coroutineScope.launch {
          try {
            loadApp(lastOpenedApp.url.toUri(), activityToBeInvalidated)
          } catch (_: Throwable) {
            if (useDefaultLaunchUrlFallback) {
              launchDefaultUrlOrNavigateToLauncher(coroutineScope, defaultLaunchUrl, activityToBeInvalidated)
            } else {
              navigateToLauncher()
            }
          }
        }
        return true
      }

      if (useDefaultLaunchUrlFallback) {
        launchDefaultUrlOrNavigateToLauncher(coroutineScope, defaultLaunchUrl, activityToBeInvalidated)
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

  private fun ensureHostWasCleared(host: ReactHost, activityToBeInvalidated: ReactActivity? = null) {
    if (host.currentReactContext?.hasActiveReactInstance() == true) {
      runBlockingOnMainThread {
        networkInterceptor?.close()
        networkInterceptor = null
        clearHost(host, activityToBeInvalidated)
      }
    }
  }

  @UiThread
  private fun clearHost(host: ReactHost, activityToBeInvalidated: ReactActivity?) {
    host.destroy("DevLauncher reloading app", null)
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

  private fun createAppIntent(): Intent {
    val newIntent = createBasicAppIntent()
    val pendingIntent = pendingIntentRegistry
      .consumePendingIntent()

    if (pendingIntent != null) {
      newIntent.action = pendingIntent.action
      newIntent.data = pendingIntent.data

      val pendingExtras = pendingIntent.extras
      if (pendingExtras != null) {
        newIntent.putExtras(pendingExtras)
      }

      val pendingCategories = pendingIntent.categories
      if (pendingCategories != null) {
        pendingCategories.forEach { pendingCategory ->
          newIntent.addCategory(pendingCategory)
        }
      }
    } else {
      // If no pending intent is available, use the extras from the intent that was used to launch the app.
      val extras = pendingIntentExtras
      if (extras != null) {
        newIntent.putExtras(extras)
      }
      pendingIntentExtras = null
    }

    return newIntent
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
      nullableInstance != null

    @JvmStatic
    val instance: DevLauncherController
      get() = checkNotNull(
        nullableInstance
      ) {
        "DevelopmentClientController.getInstance() was called before the module was initialized"
      }

    @JvmStatic
    var nullableInstance: DevLauncherController? = null

    @JvmStatic
    internal fun initialize(context: Context, reactHost: ReactHost) {
      try {
        val splashScreenManagerClass = Class.forName("expo.modules.splashscreen.SplashScreenManager")
        val splashScreenManager = splashScreenManagerClass
          .kotlin
          .objectInstance
        splashScreenManagerClass.getMethod("hide")
          .invoke(splashScreenManager)
      } catch (e: Throwable) {
        Log.e("DevLauncherController", "Failed to hide splash screen", e)
      }

      val controller = DevLauncherController(context, reactHost)
      DependencyInjection.init(context, controller)

      nullableInstance = controller
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
    fun initialize(context: Context, reactHost: ReactHost, launcherClass: Class<*>? = null) {
      initialize(context, reactHost)
      sLauncherClass = launcherClass
    }

    @JvmStatic
    fun initialize(reactApplication: ReactApplication, additionalPackages: List<ReactPackage>? = null, launcherClass: Class<*>? = null) {
      val reactHost = reactApplication.reactHost
      checkNotNull(reactHost) {
        "DevLauncherController.initialize() was called before reactHost was initialized"
      }

      initialize(reactApplication as Context, reactHost)
      sAdditionalPackages = additionalPackages
      sLauncherClass = launcherClass
    }

    @JvmStatic
    fun wrapReactActivityDelegate(activity: ReactActivity, devLauncherReactActivityDelegateSupplier: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate {
      // Set activity class as launcher for createBasicAppIntent() to correctly identify the React Native Intent when launching,
      // otherwise it will just use the main app intent, which is not always true in brownfield.
      sLauncherClass = activity::class.java

      instance.lifecycle
        .delegateWillBeCreated(activity)

      return instance
        .getCurrentReactActivityDelegate(activity, devLauncherReactActivityDelegateSupplier)
    }

    @JvmStatic
    fun tryToHandleIntent(activity: ReactActivity, intent: Intent): Boolean {
      return instance
        .handleIntent(intent, activityToBeInvalidated = activity)
    }
  }
}
