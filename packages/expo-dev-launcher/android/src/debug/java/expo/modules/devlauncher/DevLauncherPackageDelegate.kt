package expo.modules.devlauncher

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.ReactActivityDelegateHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.devlauncher.modules.DevLauncherDevMenuExtensions
import expo.modules.devlauncher.modules.DevLauncherInternalModule
import expo.modules.devlauncher.modules.DevLauncherModule
import expo.modules.devlauncher.modules.DevLauncherAuth

object DevLauncherPackageDelegate {
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
          if (application != null && application is ReactApplication) {
            DevLauncherController.initialize(application, application.reactNativeHost)
            // TODO: optional updates
          }
        }
      }
    )

  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
          DevLauncherController.maybeRedirect(activity)
        }
      }
    )

  fun createReactActivityDelegateHandlers(activityContext: Context?): List<ReactActivityDelegateHandler> =
    listOf(
      object : ReactActivityDelegateHandler {
        override fun onWillCreateReactActivityDelegate(activity: ReactActivity) {
          DevLauncherController.onWillCreateReactActivityDelegate(activity)
        }

        override fun shouldNoop(): Boolean {
          return DevLauncherController.wasInitialized() && DevLauncherController.instance.mode == DevLauncherController.Mode.LAUNCHER
        }
      }
    )

  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> =
    listOf(
      object : ReactActivityHandler {
        override fun onNewIntent(activity: ReactActivity, intent: Intent): Boolean {
          return DevLauncherController.tryToHandleIntent(activity, intent)
        }
      }
    )
}
