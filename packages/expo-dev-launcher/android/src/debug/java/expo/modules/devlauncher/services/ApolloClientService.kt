package expo.modules.devlauncher.services

import com.apollographql.apollo.ApolloClient
import com.apollographql.apollo.api.ApolloResponse
import com.apollographql.apollo.api.http.HttpHeader
import expo.modules.devlauncher.MeQuery

class ApolloClientService {
  private var _client = ApolloClient
    .Builder()
    .serverUrl("https://exp.host/--/graphql")
    .build()

  val client: ApolloClient
    get() = _client

  internal fun setSession(sessionSecret: String?) {
    val newBuilder = _client.newBuilder()

    if (sessionSecret != null) {
      newBuilder.httpHeaders(
        listOf(
          HttpHeader(
            "expo-session",
            sessionSecret
          )
        )
      )
    } else {
      newBuilder.httpHeaders(emptyList())
    }

    _client = newBuilder.build()
  }

  suspend fun fetchMe(): ApolloResponse<MeQuery.Data> {
    return client.query(
      MeQuery()
    ).execute()
  }
}
