package expo.modules.devlauncher.compose

sealed interface DevLauncherAction {
  class OpenApp(val url: String) : DevLauncherAction
}

typealias DevLauncherActionHandler = (DevLauncherAction) -> Unit
