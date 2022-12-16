package expo.modules.devlauncher.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.koin.optInject
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface

class DevLauncherDevMenuExtension(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext), DevLauncherKoinComponent {
  private val controller: DevLauncherControllerInterface? by optInject()

  override fun getName() = "EXDevLauncherExtension"

  @ReactMethod
  fun navigateToLauncherAsync(promise: Promise) {
    controller?.navigateToLauncher()
    promise.resolve(null)
  }
}
