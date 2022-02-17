package expo.modules.devlauncher

import android.app.Application
import android.content.Context
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devlauncher.modules.DevLauncherDevMenuExtensions
import expo.modules.devlauncher.modules.DevLauncherInternalModule
import expo.modules.devlauncher.modules.DevLauncherModule
import expo.modules.devlauncher.modules.DevLauncherAuth

object DevLauncherPackageDelegate {
  val shouldEnableAutoSetup: Boolean by lazy {
    // Backwards compatibility -- if the MainApplication has already set up expo-dev-launcher,
    // we just skip auto-setup in this case.
    !DevLauncherController.wasInitialized()
  }

  fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      DevLauncherModule(reactContext),
      DevLauncherInternalModule(reactContext),
      DevLauncherDevMenuExtensions(reactContext),
      DevLauncherAuth(reactContext)
    )

  fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> =
    listOf(
      object : ApplicationLifecycleListener {
        override fun onCreate(application: Application?) {
          if (shouldEnableAutoSetup && application != null && application is ReactApplication) {
            DevLauncherController.initialize(application, application.reactNativeHost)
            // TODO: optional updates
          }
        }
      }
    )

  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onNewIntent(intent: Intent?, activity: ReactActivity): Boolean {
          return shouldEnableAutoSetup && intent != null && DevLauncherController.tryToHandleIntent(activity, intent)
        }
      }
    )

  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> =
    listOf(
      object : ReactActivityHandler {
        override fun onDidCreateReactActivityDelegate(activity: ReactActivity, delegate: ReactActivityDelegate): ReactActivityDelegate? {
          if (!shouldEnableAutoSetup) {
            return null
          }
          return DevLauncherController.wrapReactActivityDelegate(activity, object : DevLauncherReactActivityDelegateSupplier {
            override fun get(): ReactActivityDelegate {
              return delegate
            }
          })
        }
      }
    )
}
