package expo.modules.devlauncher

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.ReactActivityDelegateHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
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
        override fun onNewIntent(intent: Intent?, activity: ReactActivity): Boolean {
          return intent != null && DevLauncherController.tryToHandleIntent(activity, intent)
        }
      }
    )

  fun createReactActivityDelegateHandlers(activityContext: Context?): List<ReactActivityDelegateHandler> =
    listOf(
      object : ReactActivityDelegateHandler {
        override fun onDidCreateReactActivityDelegate(activity: ReactActivity, delegate: ReactActivityDelegate): ReactActivityDelegate? {
          return DevLauncherController.wrapReactActivityDelegate(activity, object : DevLauncherReactActivityDelegateSupplier {
            override fun get(): ReactActivityDelegate {
              return delegate
            }
          })
        }
      }
    )
}
