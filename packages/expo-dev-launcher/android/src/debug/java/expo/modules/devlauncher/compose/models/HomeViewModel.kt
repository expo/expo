package expo.modules.devlauncher.compose.models

import android.util.Log
import androidx.compose.runtime.mutableStateOf
import androidx.core.net.toUri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.MeQuery
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import expo.modules.devlauncher.services.AppService
import expo.modules.devlauncher.services.ErrorRegistryService
import expo.modules.devlauncher.services.PackagerInfo
import expo.modules.devlauncher.services.PackagerService
import expo.modules.devlauncher.services.SessionService
import expo.modules.devlauncher.services.UserState
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch

sealed interface HomeAction {
  class OpenApp(val url: String) : HomeAction
  object RefetchRunningApps : HomeAction
  object ResetRecentlyOpenedApps : HomeAction
  class NavigateToCrashReport(val crashReport: DevLauncherErrorInstance) : HomeAction
}

data class HomeState(
  val appName: String = "Unknown App",
  val runningPackagers: Set<PackagerInfo> = emptySet(),
  val isFetchingPackagers: Boolean = false,
  val currentAccount: MeQuery.Account? = null,
  val recentlyOpenedApps: List<DevLauncherAppEntry> = emptyList(),
  val crashReport: DevLauncherErrorInstance? = null
)

class HomeViewModel() : ViewModel() {
  val devLauncherController = inject<DevLauncherController>()
  val sessionService = inject<SessionService>()
  val packagerService = inject<PackagerService>()
  val appService = inject<AppService>()
  val errorRegistryService = inject<ErrorRegistryService>()

  private var _state = mutableStateOf(
    HomeState(
      appName = appService.applicationInfo.appName,
      runningPackagers = packagerService.runningPackagers.value,
      currentAccount = when (val userState = sessionService.user.value) {
        UserState.Fetching, UserState.LoggedOut -> null
        is UserState.LoggedIn -> userState.selectedAccount
      },
      recentlyOpenedApps = devLauncherController.getRecentlyOpenedApps(),
      crashReport = errorRegistryService.consumeException()
    )
  )

  val state
    get() = _state.value

  init {
    packagerService
      .runningPackagers
      .onEach { newPackagers ->
        _state.value = _state.value.copy(
          runningPackagers = newPackagers
        )
      }
      .launchIn(viewModelScope)

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

      HomeAction.RefetchRunningApps -> packagerService.refetchedPackager()

      HomeAction.ResetRecentlyOpenedApps -> viewModelScope.launch {
        devLauncherController.clearRecentlyOpenedApps()
        _state.value = _state.value.copy(recentlyOpenedApps = emptyList())
      }

      is HomeAction.NavigateToCrashReport -> IllegalStateException("Navigation action should be handled by the UI layer, not the ViewModel.")
    }
  }
}
