package expo.modules.devlauncher

import android.content.Context
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactNativeHostHandler

object DevLauncherPackageDelegate {
  fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = emptyList()
  fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> = emptyList()
  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> = emptyList()
  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> = emptyList()
  fun createReactNativeHostHandlers(context: Context?): List<ReactNativeHostHandler> = emptyList()
}
