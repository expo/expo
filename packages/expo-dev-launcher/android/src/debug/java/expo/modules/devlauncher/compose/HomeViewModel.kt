package expo.modules.devlauncher.compose

import android.util.Log
import androidx.compose.runtime.mutableStateOf
import androidx.core.net.toUri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.MeQuery
import expo.modules.devlauncher.services.HttpClientService
import expo.modules.devlauncher.services.PackagerInfo
import expo.modules.devlauncher.services.PackagerService
import expo.modules.devlauncher.services.SessionService
import expo.modules.devlauncher.services.UserState
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

sealed interface HomeAction {
  class OpenApp(val url: String) : HomeAction
}

typealias HomeActionHandler = (HomeAction) -> Unit

data class HomeState(
  val appName: String = "BareExpo",
  val runningPackagers: Set<PackagerInfo> = emptySet(),
  val currentAccount: MeQuery.Account? = null
)

class HomeViewModel() : ViewModel() {
  val httpClientService = inject<HttpClientService>()
  val devLauncherController = inject<DevLauncherController>()
  val sessionService = inject<SessionService>()

  val packagerService = PackagerService(httpClientService.httpClient, viewModelScope)

  private var _state = mutableStateOf(
    HomeState(
      runningPackagers = packagerService.runningPackagers.value,
      currentAccount = when (val userState = sessionService.user.value) {
        UserState.Fetching, UserState.LoggedOut -> null
        is UserState.LoggedIn -> userState.selectedAccount
      }
    )
  )

  val state
    get() = _state.value

  init {
    packagerService.runningPackagers.onEach { newPackagers ->
      _state.value = _state.value.copy(
        runningPackagers = newPackagers
      )
    }.launchIn(viewModelScope)

    sessionService.user.onEach { newUser ->
      when (newUser) {
        UserState.Fetching, UserState.LoggedOut -> _state.value = _state.value.copy(
          currentAccount = null
        )

        is UserState.LoggedIn -> _state.value = _state.value.copy(
          currentAccount = newUser.selectedAccount
        )
      }
    }.launchIn(viewModelScope)
  }

  fun onAction(action: HomeAction) {
    when (action) {
      is HomeAction.OpenApp ->
        viewModelScope.launch {
          try {
            devLauncherController.loadApp(action.url.toUri(), mainActivity = null)
          } catch (e: Exception) {
            Log.e("DevLauncher", "Failed to open app: ${action.url}", e)
          }
        }
    }
  }
}
