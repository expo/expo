package expo.modules.devlauncher.compose

import android.util.Log
import androidx.core.net.toUri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.services.PackagerService
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient

sealed interface DevLauncherEvent {
  object LogIn : DevLauncherEvent
  object SignUp : DevLauncherEvent
}

fun interface DevLauncherEventListener {
  fun onEvent(event: DevLauncherEvent)
}

class DevLauncherViewModel(
  val devLauncherController: DevLauncherController
) : ViewModel() {
  val httpClient = OkHttpClient()
  val packagerService = PackagerService(httpClient, viewModelScope)

  private val eventListeners: MutableList<DevLauncherEventListener> = mutableListOf()

  fun addEventListener(listener: DevLauncherEventListener) {
    eventListeners.add(listener)
  }

  fun removeEventListener(listener: DevLauncherEventListener) {
    eventListeners.remove(listener)
  }

  fun emitEvent(event: DevLauncherEvent) {
    eventListeners.forEach { it.onEvent(event) }
  }

  val events = Channel<DevLauncherEvent>()

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
      DevLauncherAction.LogIn -> emitEvent(DevLauncherEvent.LogIn)
      DevLauncherAction.SignUp -> emitEvent(DevLauncherEvent.SignUp)
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
