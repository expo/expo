package expo.modules.devlauncher

import android.content.Context
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.ReactNativeHostHandler

class DevLauncherPackage : Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = DevLauncherPackageDelegate.createNativeModules(reactContext)

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()

  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> = DevLauncherPackageDelegate.createApplicationLifecycleListeners(context)

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> = DevLauncherPackageDelegate.createReactActivityLifecycleListeners(activityContext)

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> = DevLauncherPackageDelegate.createReactActivityHandlers(activityContext)

  override fun createReactNativeHostHandlers(context: Context): List<ReactNativeHostHandler> = DevLauncherPackageDelegate.createReactNativeHostHandlers(context)
}
