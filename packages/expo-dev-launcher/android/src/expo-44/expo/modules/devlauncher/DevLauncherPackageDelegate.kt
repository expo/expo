package expo.modules.devlauncher

import android.content.Context
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.devlauncher.modules.DevLauncherDevMenuExtension
import expo.modules.devlauncher.modules.DevLauncherInternalModule
import expo.modules.devlauncher.modules.DevLauncherModule
import expo.modules.devlauncher.modules.DevLauncherAuth
import expo.modules.devmenu.modules.DevMenuPreferences
import expo.modules.core.interfaces.ReactNativeHostHandler

object DevLauncherPackageDelegate {
  @JvmField
  var enableAutoSetup: Boolean? = null

  fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      DevLauncherModule(reactContext),
      DevLauncherInternalModule(reactContext),
      DevLauncherDevMenuExtension(reactContext),
      DevLauncherAuth(reactContext),
      DevMenuPreferences(reactContext)
    )

  fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> = emptyList()
  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> = emptyList()
  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> = emptyList()
  fun createReactNativeHostHandlers(): List<ReactNativeHostHandler> = emptyList()
}
