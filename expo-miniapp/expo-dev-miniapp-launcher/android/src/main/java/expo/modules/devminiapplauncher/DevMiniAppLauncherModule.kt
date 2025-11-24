package expo.modules.devminiapplauncher

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DevMiniAppLauncherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DevMiniAppLauncher")

    Constants(
      "VERSION" to BuildConfig.VERSION
    )

    Function("openLauncher") {
      // This will be called from JS to open the launcher
      val activity = appContext.currentActivity ?: return@Function
      // Implementation will be added later
    }
  }
}
