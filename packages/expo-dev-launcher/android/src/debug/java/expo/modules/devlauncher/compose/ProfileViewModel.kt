package expo.modules.devlauncher.compose

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.services.ApolloClientService
import expo.modules.devlauncher.services.SessionService
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed interface ProfileState {
  data class Account(
    val name: String,
    val avatar: String?
  )

  class LoggedIn(
    val isLoading: Boolean = true,
    val accounts: List<Account> = emptyList()
  ) : ProfileState

  object LoggedOut : ProfileState
}

class ProfileViewModel : ViewModel() {
  sealed interface Action {
    class LogIn(val sessionSecret: String) : Action
    object SignOut : Action
  }

  val sessionSession = inject<SessionService>()
  val apolloClientService = inject<ApolloClientService>()

  private val _state = MutableStateFlow<ProfileState>(ProfileState.LoggedOut)

  val state
    get() = _state.asStateFlow()

  init {
    sessionSession.session.onEach { newSession ->
      if (newSession != null) {
        fetchMe()
        _state.update {
          ProfileState.LoggedIn()
        }
      } else {
        _state.update { ProfileState.LoggedOut }
      }
    }
      .launchIn(viewModelScope)
  }

  private fun fetchMe() {
    viewModelScope.launch(Dispatchers.IO) {
      val me = apolloClientService.fetchMe()
      _state.update { prevState ->
        // User logged out in the meantime, we can ignore the result
        if (prevState is ProfileState.LoggedOut) {
          return@update prevState
        }

        val accounts = me.data?.meUserActor?.accounts?.map {
          ProfileState.Account(
            name = it.name,
            avatar = it.ownerUserActor?.profilePhoto
          )
        } ?: emptyList()

        ProfileState.LoggedIn(
          isLoading = false,
          accounts = accounts
        )
      }
    }
  }

  fun onAction(action: Action) {
    when (action) {
      is Action.LogIn -> {
        sessionSession.setSession(
          Session(action.sessionSecret)
        )
      }

      Action.SignOut -> {
        sessionSession.setSession(null)
      }
    }
  }
}
