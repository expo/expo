package expo.modules.devlauncher

import android.content.Context
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.ReactContext
import expo.modules.devlauncher.launcher.DevLauncherClientHost
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifest

const val DEV_LAUNCHER_IS_NOT_AVAILABLE = "DevLauncher isn't available in release builds"

class DevLauncherController private constructor() {
  internal enum class Mode {
    LAUNCHER, APP
  }

  val latestLoadedApp: String? = null

  internal val mode: Mode
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  val devClientHost: DevLauncherClientHost
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  val manifest: DevLauncherManifest
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  val appHost: ReactNativeHost
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

  fun maybeInitDevMenuDelegate(context: ReactContext) {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  fun navigateToLauncher() {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  suspend fun loadApp(appUrl: String, reactActivity: ReactActivity?) {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  fun onAppLoaded(context: ReactContext) {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE) 
  }

  fun onAppLoadedWithError() {
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
    fun initialize(context: Context, reactNativeHost: ReactNativeHost) {
      check(sInstance == null) { "DevelopmentClientController was initialized." }
      sInstance = DevLauncherController()
    }

    @JvmStatic
    fun initialize(context: Context, appHost: ReactNativeHost, cazz: Class<*>) {
      initialize(context, appHost)
    }

    @JvmStatic
    fun wrapReactActivityDelegate(reactActivity: ReactActivity, devLauncherReactActivityDelegateSupplier: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate {
      return devLauncherReactActivityDelegateSupplier.get()
    }

    @JvmStatic
    fun tryToHandleIntent(reactActivity: ReactActivity, intent: Intent): Boolean = false

    @JvmStatic
    fun wasInitialized(): Boolean = false
  }
}
