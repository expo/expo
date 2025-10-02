package expo.modules.devlauncher.compose.models

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import com.facebook.react.ReactActivity
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.launcher.errors.DevLauncherAppError
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.launch

sealed interface ErrorAction {
  object Reload : ErrorAction
  object GoToHome : ErrorAction
}

class ErrorViewModel() : ViewModel() {
  private val _appError = mutableStateOf<DevLauncherAppError?>(null)

  val appError
    get() = _appError.value

  fun setError(error: DevLauncherAppError) {
    _appError.value = error
  }

  fun onAction(action: ErrorAction) {
    val devLauncher = inject<DevLauncherController>()

    when (action) {
      is ErrorAction.Reload -> {
        val appUrl = devLauncher.latestLoadedApp

        if (appUrl == null) {
          devLauncher.navigateToLauncher()
          return
        }

        devLauncher.coroutineScope.launch {
          devLauncher
            .loadApp(
              appUrl,
              devLauncher.appHost.currentReactContext?.currentActivity as? ReactActivity?
            )
        }
      }

      is ErrorAction.GoToHome -> devLauncher.navigateToLauncher()
    }
  }
}
