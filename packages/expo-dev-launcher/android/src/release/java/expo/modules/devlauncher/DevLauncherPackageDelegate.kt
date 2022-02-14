package expo.modules.devlauncher

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext

object DevLauncherPackageDelegate {
  fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = emptyList()
  fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> = emptyList()
  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> = emptyList()
  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> = emptyList()
  fun createReactActivityListeners(activityContext: Context?): List<ReactActivityListener> = emptyList()
}
