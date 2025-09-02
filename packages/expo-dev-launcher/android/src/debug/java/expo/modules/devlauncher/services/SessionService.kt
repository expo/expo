package expo.modules.devlauncher.services

import android.content.SharedPreferences
import androidx.core.content.edit
import expo.modules.devlauncher.MeQuery
import expo.modules.devlauncher.compose.Session
import expo.modules.devlauncher.compose.saveToPreferences
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update

sealed interface UserState {
  object LoggedOut : UserState
  object Fetching : UserState
  data class LoggedIn(
    val data: MeQuery.Data,
    val selectedAccount: MeQuery.Account?
  ) : UserState
}

class SessionService(
  val sessionStore: SharedPreferences,
  private val apolloClientService: ApolloClientService,
  private val httpClientService: HttpClientService
) {
  private val _session = MutableStateFlow<Session?>(restoreSession())

  private val _user = MutableStateFlow<UserState>(UserState.LoggedOut)
  val user
    get() = _user.asStateFlow()

  private val sessionScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

  init {
    _session.onEach { newSession ->
      if (newSession == null) {
        _user.update { UserState.LoggedOut }
        return@onEach
      }

      _user.update { UserState.Fetching }

      val me = apolloClientService.fetchMe()
      val data = me.data
      if (me.hasErrors() || data == null) {
        // TOOD(@lukmccall): Handle errors properly
        _user.update { UserState.LoggedOut }
        return@onEach
      }

      val selectedAccountId = restoreSelectedAccount()
      val selectedAccount = data.meUserActor?.accounts?.find { account -> account.id == selectedAccountId }
        ?: data.meUserActor?.accounts?.firstOrNull()
      _user.update {
        UserState.LoggedIn(
          data,
          selectedAccount = selectedAccount
        )
      }
    }
      .launchIn(sessionScope)
  }

  fun setSession(newSession: Session?) {
    newSession.saveToPreferences(sessionStore)
    apolloClientService.setSession(newSession?.sessionSecret)
    httpClientService.setSession(newSession?.sessionSecret)
    _session.update { newSession }
  }

  fun switchAccount(accountId: String) {
    _user.update { currentState ->
      if (currentState is UserState.LoggedIn) {
        val newSelectedAccount = currentState.data.meUserActor?.accounts?.find { account -> account.id == accountId }
        // We cannot find the account with the given ID, so we return the current state
        if (newSelectedAccount == null) {
          return@update currentState
        }
        saveSelectedAccount(newSelectedAccount.id)
        currentState.copy(selectedAccount = newSelectedAccount)
      } else {
        currentState
      }
    }
  }

  private fun restoreSession(): Session? {
    val newSession = Session.loadFromPreferences(sessionStore)
    apolloClientService.setSession(newSession?.sessionSecret)
    httpClientService.setSession(newSession?.sessionSecret)
    return newSession
  }

  private fun restoreSelectedAccount(): String? {
    return sessionStore.getString("selected_account", null)
  }

  private fun saveSelectedAccount(accountId: String?) {
    sessionStore.edit(commit = true) {
      if (accountId == null) {
        remove("selected_account")
      } else {
        putString("selected_account", accountId)
      }
    }
  }
}
