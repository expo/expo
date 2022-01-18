package expo.modules.devlauncher

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.devlauncher.modules.DevLauncherDevMenuExtensions
import expo.modules.devlauncher.modules.DevLauncherInternalModule
import expo.modules.devlauncher.modules.DevLauncherModule

object DevLauncherPackageDelegate {
  fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      DevLauncherModule(reactContext),
      DevLauncherInternalModule(reactContext),
      DevLauncherDevMenuExtensions(reactContext)
    )
}
