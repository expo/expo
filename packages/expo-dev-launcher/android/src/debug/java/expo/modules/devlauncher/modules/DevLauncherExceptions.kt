package expo.modules.devlauncher.modules

import expo.modules.kotlin.exception.CodedException

internal class DevLauncherInvalidURLException :
  CodedException("Invalid url provided to loadApp")

internal class DevLauncherNotAvailableException :
  CodedException("DevLauncherController is not available")

internal class DevLauncherLoadAppException(cause: Throwable?) :
  CodedException("Failed to load app", cause)
