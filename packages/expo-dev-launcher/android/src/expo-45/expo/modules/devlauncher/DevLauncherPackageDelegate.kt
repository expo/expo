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
import expo.modules.devlauncher.modules.DevLauncherInternalModule
import expo.modules.devlauncher.modules.DevLauncherModule
import expo.modules.devlauncher.modules.DevLauncherAuth
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devlauncher.modules.DevLauncherDevMenuExtension
import expo.modules.devmenu.modules.DevMenuPreferences
import expo.modules.devlauncher.rncompatibility.DevLauncherReactNativeHostHandler

object DevLauncherPackageDelegate {
  @JvmField
  var enableAutoSetup: Boolean? = null
  private val shouldEnableAutoSetup: Boolean by lazy {
    if (enableAutoSetup != null) {
      // if someone else has set this explicitly, use that value
      return@lazy enableAutoSetup!!
    }
    if (DevLauncherController.wasInitialized()) {
      // Backwards compatibility -- if the MainApplication has already set up expo-dev-launcher,
      // we just skip auto-setup in this case.
      return@lazy false
    }
    return@lazy true
  }

  fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      DevLauncherModule(reactContext),
      DevLauncherInternalModule(reactContext),
      DevLauncherDevMenuExtension(reactContext),
      DevLauncherAuth(reactContext),
      DevMenuPreferences(reactContext)
    )

  fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> =
    listOf(
      object : ApplicationLifecycleListener {
        override fun onCreate(application: Application?) {
          if (shouldEnableAutoSetup && application != null && application is ReactApplication) {
            DevLauncherController.initialize(application, application.reactNativeHost)
            DevLauncherUpdatesInterfaceDelegate.initializeUpdatesInterface(application)
          }
        }
      }
    )

  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onNewIntent(intent: Intent?): Boolean {
          if (!shouldEnableAutoSetup || intent == null || activityContext == null || activityContext !is ReactActivity) {
            return false
          }
          return DevLauncherController.tryToHandleIntent(activityContext, intent)
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
          return DevLauncherController.wrapReactActivityDelegate(
            activity,
            object : DevLauncherReactActivityDelegateSupplier {
              override fun get(): ReactActivityDelegate {
                return delegate
              }
            }
          )
        }
      }
    )

  fun createReactNativeHostHandlers(context: Context): List<ReactNativeHostHandler> = listOf(DevLauncherReactNativeHostHandler(context))
}
