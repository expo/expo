package expo.modules.devlauncher.services

import android.content.Context
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorRegistry

class ErrorRegistryService(context: Context) {
  private val registry = DevLauncherErrorRegistry(context)

  fun consumeException(): DevLauncherErrorInstance? {
    return registry.consumeException()
  }
}
