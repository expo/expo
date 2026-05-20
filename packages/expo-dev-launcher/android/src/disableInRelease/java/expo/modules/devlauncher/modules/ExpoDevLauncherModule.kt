package expo.modules.devlauncher.modules

import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoDevLauncherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoDevLauncher")

    AsyncFunction("loadApp") { uri: Uri -> }
  }
}
