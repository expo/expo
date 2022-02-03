package expo.modules.devlauncher

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import expo.modules.core.interfaces.Package

class DevLauncherPackage : Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = DevLauncherPackageDelegate.createNativeModules(reactContext);

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
