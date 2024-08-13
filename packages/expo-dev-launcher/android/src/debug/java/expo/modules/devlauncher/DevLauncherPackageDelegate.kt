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
import expo.modules.devlauncher.launcher.DevLauncherReactNativeHostHandler
import expo.modules.updatesinterface.UpdatesControllerRegistry
import java.lang.ref.WeakReference

object DevLauncherPackageDelegate {
  fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      DevLauncherModule(reactContext),
      DevLauncherInternalModule(reactContext),
      DevLauncherDevMenuExtension(reactContext),
      DevLauncherAuth(reactContext)
    )

  fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> =
    listOf(
      object : ApplicationLifecycleListener {
        override fun onCreate(application: Application?) {
          check(application is ReactApplication)
          DevLauncherController.initialize(application)
          UpdatesControllerRegistry.controller?.get()?.let {
            DevLauncherController.instance.updatesInterface = it
            it.updatesInterfaceCallbacks = WeakReference(DevLauncherController.instance)
          }
        }
      }
    )

  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onNewIntent(intent: Intent?): Boolean {
          if (intent == null || activityContext == null || activityContext !is ReactActivity) {
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
