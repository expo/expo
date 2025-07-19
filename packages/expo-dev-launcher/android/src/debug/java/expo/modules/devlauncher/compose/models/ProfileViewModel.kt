package expo.modules.devlauncher.compose.models

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.compose.Session
import expo.modules.devlauncher.services.SessionService
import expo.modules.devlauncher.services.UserState
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update

data class Account(
  val id: String,
  val name: String,
  val avatar: String?,
  val isSelected: Boolean = false
)

sealed interface ProfileState {
  class LoggedIn(
    val accounts: List<Account> = emptyList()
  ) : ProfileState

  object Fetching : ProfileState
  object LoggedOut : ProfileState
}

class ProfileViewModel : ViewModel() {
  sealed interface Action {
    class LogIn(val sessionSecret: String) : Action
    class SwitchAccount(val account: Account) : Action
    object SignOut : Action
  }

  val session = inject<SessionService>()

  private val _state = MutableStateFlow<ProfileState>(ProfileState.LoggedOut)

  val state
    get() = _state.asStateFlow()

  init {
    session.user.onEach { newUserState ->
      when (newUserState) {
        UserState.LoggedOut -> _state.update { ProfileState.LoggedOut }
        UserState.Fetching -> _state.update { ProfileState.Fetching }
        is UserState.LoggedIn -> _state.update {
          ProfileState.LoggedIn(
            accounts = newUserState.data.meUserActor?.accounts?.map { account ->
              Account(
                id = account.id,
                name = account.name,
                avatar = account.ownerUserActor?.profilePhoto,
                isSelected = account.id == newUserState.selectedAccount?.id
              )
            } ?: emptyList()
          )
        }
      }
    }
      .launchIn(viewModelScope)
  }

  fun onAction(action: Action) {
    when (action) {
      is Action.LogIn -> {
        session.setSession(
          Session(action.sessionSecret)
        )
      }

      Action.SignOut -> {
        session.setSession(null)
      }

      is Action.SwitchAccount -> session.switchAccount(action.account.id)
    }
  }
}
