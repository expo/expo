package expo.modules.devlauncher.compose

import android.util.Log
import androidx.core.net.toUri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.services.PackagerService
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient

class DevLauncherViewModel(
  val devLauncherController: DevLauncherController
) : ViewModel() {
  val httpClient = OkHttpClient()

  val packagerService = PackagerService(httpClient, viewModelScope)

  fun onAction(action: DevLauncherAction) {
    when (action) {
      is DevLauncherAction.OpenApp ->
        viewModelScope.launch {
          try {
            devLauncherController.loadApp(action.url.toUri(), mainActivity = null)
          } catch (e: Exception) {
            Log.e("DevLauncher", "Failed to open app: ${action.url}", e)
          }
        }
    }
  }

  companion object {
    class Factory(
      private val devLauncherController: DevLauncherController
    ) : ViewModelProvider.Factory {
      override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return DevLauncherViewModel(devLauncherController) as T
      }
    }
  }
}
