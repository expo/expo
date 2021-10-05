package expo.modules.devlauncher.modules

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.koin.optInject
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface

class DevLauncherModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext), DevLauncherKoinComponent {
  private val controller: DevLauncherControllerInterface? by optInject()

  override fun getName() = "EXDevLauncher"

  override fun hasConstants() = true

  override fun getConstants(): Map<String, Any?> {
    val manifestString = try {
      controller?.manifest?.getRawJson().toString()
    } catch (_: IllegalStateException) {
      null
    }
    val manifestURLString = try {
      controller?.manifestURL?.toString()
    } catch (_: IllegalStateException) {
      null
    }

    return mapOf<String, Any?>(
      "manifestString" to manifestString,
      "manifestURL" to manifestURLString
    )
  }
}
