package expo.modules.devlauncher

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactContext
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesInterface
import kotlinx.coroutines.CoroutineScope

const val DEV_LAUNCHER_IS_NOT_AVAILABLE = "DevLauncher isn't available in release builds"

class DevLauncherController private constructor() : DevLauncherControllerInterface {
  enum class Mode {
    LAUNCHER,
    APP
  }

  override val latestLoadedApp: Uri? = null

  override val mode: Mode
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  override val devClientHost: ReactHostWrapper
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  override val manifest: Manifest
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  override val manifestURL: Uri
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  override val appHost: ReactHostWrapper
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  override var updatesInterface: UpdatesInterface?
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
    set(_) {}

  override fun onRequestRelaunch() {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override val coroutineScope: CoroutineScope
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  override val useDeveloperSupport = false

  override fun getCurrentReactActivityDelegate(activity: ReactActivity, delegateSupplierDevLauncher: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override fun handleIntent(intent: Intent?, activityToBeInvalidated: ReactActivity?): Boolean {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override fun navigateToLauncher() {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override suspend fun loadApp(url: Uri, mainActivity: ReactActivity?) {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override suspend fun loadApp(url: Uri, projectUrl: Uri?, mainActivity: ReactActivity?) {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override fun onAppLoaded(context: ReactContext) {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override fun onAppLoadedWithError() {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override fun getRecentlyOpenedApps(): List<DevLauncherAppEntry> {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override fun clearRecentlyOpenedApps() {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  companion object {
    private var sInstance: DevLauncherController? = null

    @JvmStatic
    val instance: DevLauncherController
      get() = checkNotNull(sInstance) {
        "DevelopmentClientController.getInstance() was called before the module was initialized"
      }

    @JvmStatic
    internal fun initialize(context: Context, reactHost: ReactHostWrapper) {
      check(sInstance == null) { "DevelopmentClientController was initialized." }
      sInstance = DevLauncherController()
    }

    @JvmStatic
    fun initialize(context: Context, reactHost: ReactHostWrapper, launcherClass: Class<*>? = null) {
      initialize(context, reactHost)
    }

    @JvmStatic
    fun initialize(reactApplication: ReactApplication, additionalPackages: List<*>? = null, launcherClass: Class<*>? = null) {
      initialize(reactApplication as Context, ReactHostWrapper(reactApplication.reactNativeHost, { reactApplication.reactHost }))
    }

    @JvmStatic
    fun wrapReactActivityDelegate(reactActivity: ReactActivity, devLauncherReactActivityDelegateSupplier: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate {
      return devLauncherReactActivityDelegateSupplier.get()
    }

    @JvmStatic
    fun tryToHandleIntent(reactActivity: ReactActivity, intent: Intent): Boolean = false

    @JvmStatic
    fun wasInitialized(): Boolean = false

    @JvmStatic
    fun getMetadataValue(context: Context, key: String, defaultValue: String = ""): String {
      throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
    }
  }
}
