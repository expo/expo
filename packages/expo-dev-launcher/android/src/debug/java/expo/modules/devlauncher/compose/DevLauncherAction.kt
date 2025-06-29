package expo.modules.devlauncher.compose

sealed interface DevLauncherAction {
  class OpenApp(val url: String) : DevLauncherAction
  object LogIn : DevLauncherAction
  object SignUp : DevLauncherAction
}

typealias DevLauncherActionHandler = (DevLauncherAction) -> Unit
