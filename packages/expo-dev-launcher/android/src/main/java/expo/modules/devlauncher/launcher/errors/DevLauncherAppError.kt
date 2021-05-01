package expo.modules.devlauncher.launcher.errors

import java.util.*

class DevLauncherAppError(
  errorMessage: String?,
  val error: Throwable,
) {
  val timestamp: Date = Calendar.getInstance().time
  val message = errorMessage?.replace("\\e\\[(.*?)m".toRegex(), "")
}
