package expo.modules.devlauncher

import android.app.Application
import android.content.Context
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityListener
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier

class DevLauncherPackage : Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = DevLauncherPackageDelegate.createNativeModules(reactContext);

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()

  // TODO: maybe put this in the debug flavor only?
  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> {
    val listener = object : ApplicationLifecycleListener {
      override fun onCreate(application: Application?) {
        if (application != null && application is ReactApplication) {
          DevLauncherController.initialize(application, application.reactNativeHost)
          // TODO: optional updates
        }
      }
    }
    return listOf(listener)
  }

  // TODO: maybe put this in the debug flavor only?
  override fun createReactActivityListeners(activityContext: Context?): List<ReactActivityListener> {
    val listener = object : ReactActivityListener {
      override fun createReactActivityDelegate(activity: ReactActivity, delegate: ReactActivityDelegate): ReactActivityDelegate? {
        return DevLauncherController.wrapReactActivityDelegate(activity, object : DevLauncherReactActivityDelegateSupplier {
          override fun get(): ReactActivityDelegate {
            return delegate
          }
        })
      }

      override fun onNewIntent(activity: ReactActivity, intent: Intent): Boolean {
        return DevLauncherController.tryToHandleIntent(activity, intent)
      }
    }
    return listOf(listener)
  }
}
