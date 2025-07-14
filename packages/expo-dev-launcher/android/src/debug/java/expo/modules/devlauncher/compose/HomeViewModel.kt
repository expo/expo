package expo.modules.devlauncher.compose

import android.util.Log
import androidx.compose.runtime.mutableStateOf
import androidx.core.net.toUri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.MeQuery
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
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
  object RefetchRunningApps : HomeAction
  object ResetRecentlyOpendApps : HomeAction
}

data class HomeState(
  val appName: String = "BareExpo",
  val runningPackagers: Set<PackagerInfo> = emptySet(),
  val isFetchingPackagers: Boolean = false,
  val currentAccount: MeQuery.Account? = null,
  val recentlyOpenedApps: List<DevLauncherAppEntry> = emptyList()
)

class HomeViewModel() : ViewModel() {
  val devLauncherController = inject<DevLauncherController>()
  val sessionService = inject<SessionService>()
  val packagerService = inject<PackagerService>()

  private var _state = mutableStateOf(
    HomeState(
      runningPackagers = packagerService.runningPackagers.value,
      currentAccount = when (val userState = sessionService.user.value) {
        UserState.Fetching, UserState.LoggedOut -> null
        is UserState.LoggedIn -> userState.selectedAccount
      },
      recentlyOpenedApps = devLauncherController.getRecentlyOpenedApps()
    )
  )

  val state
    get() = _state.value

  init {
    viewModelScope.launch {
      packagerService.refetchedPackager()
    }

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

    packagerService.isLoading.onEach { isLoading ->
      _state.value = _state.value.copy(
        isFetchingPackagers = isLoading
      )
    }.launchIn(viewModelScope)
  }

  fun onAction(action: HomeAction) {
    when (action) {
      is HomeAction.OpenApp ->
        devLauncherController.coroutineScope.launch {
          try {
            devLauncherController.loadApp(action.url.toUri(), mainActivity = null)
          } catch (e: Exception) {
            Log.e("DevLauncher", "Failed to open app: ${action.url}", e)
          }
        }

      HomeAction.RefetchRunningApps -> viewModelScope.launch { packagerService.refetchedPackager() }

      HomeAction.ResetRecentlyOpendApps -> viewModelScope.launch {
        devLauncherController.clearRecentlyOpenedApps()
        _state.value = _state.value.copy(recentlyOpenedApps = emptyList())
      }
    }
  }
}
