package expo.modules.devlauncher

import android.content.Context
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import expo.modules.devlauncher.launcher.DevLauncherClientHost
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier

private const val DEV_LAUNCHER_IS_NOT_AVAILABLE = "DevLauncher isn't available in release builds"

class DevLauncherController private constructor() {
  val devClientHost: DevLauncherClientHost
    get() = throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)

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
  }
}
