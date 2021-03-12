package expo.interfaces.devmenu

import okhttp3.Response

interface DevMenuExpoApiClientInterface {
  fun isLoggedIn(): Boolean
  fun setSessionSecret(newSessionSecret: String?)
  suspend fun queryMyProjects(limit: Int = 15, offset: Int = 0): Response
  suspend fun queryDevSessions(): Response
}
