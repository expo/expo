package expo.modules.devlauncher

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityDelegateHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.ReactActivityListener
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devlauncher.splashscreen.DevLauncherSplashScreenProvider

class DevLauncherPackage : Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = DevLauncherPackageDelegate.createNativeModules(reactContext);

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()

  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> = DevLauncherPackageDelegate.createApplicationLifecycleListeners(context);

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> = DevLauncherPackageDelegate.createReactActivityLifecycleListeners(activityContext);

  override fun createReactActivityDelegateHandlers(activityContext: Context?): List<ReactActivityDelegateHandler> = DevLauncherPackageDelegate.createReactActivityDelegateHandlers(activityContext);

  override fun createReactActivityListeners(activityContext: Context?): List<ReactActivityListener> = DevLauncherPackageDelegate.createReactActivityListeners(activityContext);
}
