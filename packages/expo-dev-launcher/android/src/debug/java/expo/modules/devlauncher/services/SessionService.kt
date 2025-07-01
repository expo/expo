package expo.modules.devlauncher.services

import android.content.SharedPreferences
import expo.modules.devlauncher.compose.Session
import expo.modules.devlauncher.compose.saveToPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update

class SessionService(
  val sessionStore: SharedPreferences,
  private val apolloClientService: ApolloClientService
) {
  var session = MutableStateFlow<Session?>(restoreSession())
    private set

  fun setSession(newSession: Session?) {
    newSession.saveToPreferences(sessionStore)
    apolloClientService.setSession(newSession?.sessionSecret)
    session.update { newSession }
  }

  private fun restoreSession(): Session? {
    val newSession = Session.loadFromPreferences(sessionStore)
    apolloClientService.setSession(newSession?.sessionSecret)
    return newSession
  }
}
