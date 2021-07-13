package expo.modules.devlauncher.launcher.errors

import java.util.*

class DevLauncherAppError(
  errorMessage: String?,
  val error: Throwable
) {
  val timestamp: Date = Calendar.getInstance().time
  val message = errorMessage?.replace("\\x1b\\[[0-9;]*m".toRegex(), "")
}
