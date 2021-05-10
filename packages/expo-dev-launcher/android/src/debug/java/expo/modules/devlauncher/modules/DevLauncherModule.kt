package expo.modules.devlauncher.modules

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import expo.modules.devlauncher.DevLauncherController

class DevLauncherModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "EXDevLauncher"

  override fun hasConstants() = true

  override fun getConstants(): Map<String, Any?> {
    val manifestString = try {
      DevLauncherController.instance.manifest?.rawData
    } catch (_: IllegalStateException) {
      null
    }

    return mapOf<String, Any?>(
      "manifestString" to manifestString
    )
  }
}
