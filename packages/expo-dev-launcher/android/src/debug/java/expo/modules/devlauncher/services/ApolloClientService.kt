package expo.modules.devlauncher.services

import com.apollographql.apollo.ApolloClient
import com.apollographql.apollo.api.ApolloResponse
import com.apollographql.apollo.api.http.HttpHeader
import com.apollographql.apollo.network.okHttpClient
import expo.modules.devlauncher.GetBranchesQuery
import expo.modules.devlauncher.GetBranchesWithCompatibleUpdateQuery
import expo.modules.devlauncher.GetUpdatesWithFiltersQuery
import expo.modules.devlauncher.MeQuery
import expo.modules.devlauncher.type.AppPlatform

class ApolloClientService(
  httpClientService: HttpClientService
) {
  private var _client = ApolloClient
    .Builder()
    .serverUrl("https://exp.host/--/graphql")
    .okHttpClient(httpClientService.httpClient)
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

  suspend fun fetchBranches(
    appId: String,
    runtimeVersion: String,
    offset: Int = 0,
    limit: Int = 50
  ): ApolloResponse<GetBranchesWithCompatibleUpdateQuery.Data> {
    return client.query(
      GetBranchesWithCompatibleUpdateQuery(
        appId = appId,
        offset = offset,
        limit = limit,
        runtimeVersion = runtimeVersion,
        platform = AppPlatform.ANDROID
      )
    ).execute()
  }

  suspend fun fetchBranches(
    appId: String,
    offset: Int = 0,
    limit: Int = 50
  ): ApolloResponse<GetBranchesQuery.Data> {
    return client.query(
      GetBranchesQuery(
        appId = appId,
        offset = offset,
        limit = limit,
        platform = AppPlatform.ANDROID
      )
    ).execute()
  }

  suspend fun fetchUpdates(
    appId: String,
    branchName: String,
    offset: Int = 0,
    limit: Int = 50
  ): ApolloResponse<GetUpdatesWithFiltersQuery.Data> {
    return client.query(
      GetUpdatesWithFiltersQuery(
        appId = appId,
        offset = offset,
        limit = limit,
        platform = AppPlatform.ANDROID,
        branchName = branchName
      )
    ).execute()
  }
}
