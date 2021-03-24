package expo.modules.devmenu.api

import expo.interfaces.devmenu.DevMenuExpoApiClientInterface
import expo.modules.devmenu.constants.AuthHeader
import expo.modules.devmenu.constants.GraphQLEndpoint
import expo.modules.devmenu.constants.RESTEndpoint
import expo.modules.devmenu.helpers.await
import expo.modules.devmenu.helpers.fetch
import expo.modules.devmenu.helpers.fetchGraphQL
import okhttp3.OkHttpClient
import okhttp3.Response

class DevMenuExpoApiClient : DevMenuExpoApiClientInterface {
  private val httpClient = OkHttpClient()
  private var sessionSecret: String? = null

  override fun isLoggedIn(): Boolean = sessionSecret != null

  override fun setSessionSecret(newSessionSecret: String?) {
    sessionSecret = newSessionSecret
  }

  override suspend fun queryDevSessions(): Response {
    val secret = requireNotNull(sessionSecret) { "You are logout! To get your projects, you need to sign in first." }

    return fetch(
      RESTEndpoint
        .buildUpon()
        .appendPath("development-sessions")
        .build(),
      AuthHeader to secret
    ).await(httpClient)
  }

  override suspend fun queryMyProjects(limit: Int, offset: Int): Response {
    val secret = requireNotNull(sessionSecret) { "You are logout! To get your projects, you need to sign in first." }

    return fetchGraphQL(
      GraphQLEndpoint,
      """
      query DevMenu_Projects { 
        me {
         apps(limit: 15, offset: 0) { 
            id 
          }
        }
      }
      """,
      AuthHeader to secret
    ).await(httpClient)
  }
}
