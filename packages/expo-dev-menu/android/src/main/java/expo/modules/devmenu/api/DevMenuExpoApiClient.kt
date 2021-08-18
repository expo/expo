package expo.modules.devmenu.api

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.reflect.TypeToken
import expo.interfaces.devmenu.expoapi.DevMenuEASUpdates
import expo.interfaces.devmenu.expoapi.DevMenuExpoApiClientInterface
import expo.interfaces.devmenu.expoapi.DevMenuGraphQLOptions
import expo.interfaces.devmenu.expoapi.Response
import expo.modules.devmenu.constants.AuthHeader
import expo.modules.devmenu.constants.GraphQLEndpoint
import expo.modules.devmenu.constants.RESTEndpoint
import expo.modules.devmenu.helpers.await
import expo.modules.devmenu.helpers.fetch
import expo.modules.devmenu.helpers.fetchGraphQL
import okhttp3.OkHttpClient

class DevMenuExpoApiClient : DevMenuExpoApiClientInterface {
  private val httpClient = OkHttpClient()
  private var sessionSecret: String? = null

  override fun isLoggedIn(): Boolean = sessionSecret != null

  override fun setSessionSecret(newSessionSecret: String?) {
    sessionSecret = newSessionSecret
  }

  override suspend fun queryDevSessions(): okhttp3.Response {
    val secret = ensureUserIsSignIn()

    return fetch(
      RESTEndpoint
        .buildUpon()
        .appendPath("development-sessions")
        .build(),
      AuthHeader to secret
    ).await(httpClient)
  }

  override suspend fun queryMyProjects(options: DevMenuGraphQLOptions): okhttp3.Response {
    val secret = ensureUserIsSignIn()

    return fetchGraphQL(
      GraphQLEndpoint,
      """
      query DevMenu_Projects {
        me {
         apps(limit: ${options.limit}, offset: ${options.offset}) {
            id
          }
        }
      }
      """,
      AuthHeader to secret
    ).await(httpClient)
  }

  override suspend fun queryUpdateChannels(appId: String, options: DevMenuGraphQLOptions): Response<List<DevMenuEASUpdates.Channel>> {
    val secret = ensureUserIsSignIn()

    val okHttpResponse = fetchGraphQL(
      GraphQLEndpoint,
      """
      {
        app {
          byId(appId: "$appId") {
            updateChannels(offset: ${options.offset}, limit: ${options.limit}) {
              id
              name
              createdAt
              updatedAt
            }
          }
        }
      }
      """,
      AuthHeader to secret
    ).await(httpClient)

    return Response(
      status = @Suppress("DEPRECATION_ERROR") okHttpResponse.code(),
      data = parseGraphQLResponse(okHttpResponse, "data", "app", "byId", "updateChannels")
    )
  }

  override suspend fun queryUpdateBranches(appId: String, branchesOptions: DevMenuGraphQLOptions, updatesOptions: DevMenuGraphQLOptions): Response<List<DevMenuEASUpdates.Branch>> {
    val secret = ensureUserIsSignIn()

    val okHttpResponse = fetchGraphQL(
      GraphQLEndpoint,
      """
      {
        app {
          byId(appId: "$appId") {
            updateBranches(offset: ${branchesOptions.offset}, limit: ${branchesOptions.limit}) {
              id
              updates(offset: ${updatesOptions.offset}, limit: ${updatesOptions.limit}) {
                id
                runtimeVersion
                platform
                message
                updatedAt
                createdAt
              }
            }
          }
        }
      }
      """,
      AuthHeader to secret
    ).await(httpClient)

    return Response(
      status = @Suppress("DEPRECATION_ERROR") okHttpResponse.code(),
      data = parseGraphQLResponse(okHttpResponse, "data", "app", "byId", "updateBranches")
    )
  }

  private fun ensureUserIsSignIn(): String {
    return requireNotNull(sessionSecret) { "You are logout! To get your projects, you need to sign in first." }
  }

  private inline fun <reified T> parseGraphQLResponse(okHttpResponse: okhttp3.Response, vararg dataPath: String): List<T>? {
    if (!okHttpResponse.isSuccessful) {
      return null
    }
    @Suppress("DEPRECATION_ERROR")
    val bodyReader = okHttpResponse.body()?.charStream()?.readText() ?: return null
    val gson = Gson()
    var json: JsonElement = gson.fromJson(bodyReader, JsonObject::class.java)
    for (path in dataPath) {
      val next = (json as JsonObject?)?.get(path) ?: return null
      json = next
    }

    val typeToken = TypeToken.getParameterized(List::class.java, T::class.java)
    return gson.fromJson(json, typeToken.type) as List<T>
  }
}
