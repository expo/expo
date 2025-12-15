package host.exp.exponent.services

import com.apollographql.apollo.ApolloClient
import com.apollographql.apollo.cache.normalized.FetchPolicy
import com.apollographql.apollo.cache.normalized.api.MemoryCacheFactory
import com.apollographql.apollo.cache.normalized.fetchPolicy
import com.apollographql.apollo.cache.normalized.normalizedCache
import com.apollographql.apollo.network.okHttpClient
import host.exp.exponent.apollo.AuthInterceptor
import host.exp.exponent.apollo.Paginator
import host.exp.exponent.graphql.BranchDetailsQuery
import host.exp.exponent.graphql.BranchesForProjectQuery
import host.exp.exponent.graphql.Home_AccountAppsQuery
import host.exp.exponent.graphql.Home_AccountSnacksQuery
import host.exp.exponent.graphql.Home_CurrentUserActorQuery
import host.exp.exponent.graphql.Home_ViewerPrimaryAccountNameQuery
import host.exp.exponent.graphql.ProjectsQuery
import host.exp.exponent.graphql.fragment.CurrentUserActorData
import host.exp.exponent.graphql.type.AppPlatform
import okhttp3.OkHttpClient

class ApolloClientService(
  httpClient: OkHttpClient
) {
  private val normalizedCacheFactory = MemoryCacheFactory(maxSizeBytes = 10 * 1024 * 1024)

  private val apolloClient = ApolloClient
    .Builder()
    .serverUrl("https://exp.host/--/graphql")
    .okHttpClient(httpClient)
    .normalizedCache(normalizedCacheFactory)
    .addHttpInterceptor(AuthInterceptor { null })
    .fetchPolicy(FetchPolicy.CacheAndNetwork)
    .build()

  suspend fun currentUser(): CurrentUserActorData? {
    return apolloClient.query(
      Home_CurrentUserActorQuery()
    )
      .execute()
      .dataOrThrow()
      .meUserActor
      ?.currentUserActorData
  }

  suspend fun branchDetails(
    name: String,
    appId: String
  ): BranchDetailsQuery.ById {
    return apolloClient.query(
      BranchDetailsQuery(
        name = name,
        appId = appId,
        platform = AppPlatform.ANDROID
      )
    )
      .execute()
      .dataOrThrow()
      .app
      .byId
  }

  fun branches(
    appId : String
  ): Paginator<BranchesForProjectQuery.UpdateBranch> {
    return Paginator(
      fetch = { limit, offset ->
        apolloClient.query(
          BranchesForProjectQuery(
            appId = appId,
            platform = AppPlatform.ANDROID,
            limit = limit,
            offset = offset
          )
        )
          .execute()
          .dataOrThrow()
          .app
          .byId
          .updateBranches
      }
    )
  }

  fun apps(
    accountName: String
  ): Paginator<Home_AccountAppsQuery.App> {
    return Paginator(
      fetch = { limit, offset ->
        apolloClient.query(
          Home_AccountAppsQuery(
            accountName = accountName,
            platform = AppPlatform.ANDROID,
            limit = limit,
            offset = offset
          )
        )
          .execute()
          .dataOrThrow()
          .account
          .byName
          .apps
      }
    )
  }

  suspend fun app(
    appId: String
  ): ProjectsQuery.ById {
    return apolloClient.query(
      ProjectsQuery(
        appId = appId,
        platform = AppPlatform.ANDROID
      )
    )
      .execute()
      .dataOrThrow()
      .app
      .byId
  }

  fun snacks(
    accountName: String
  ): Paginator<Home_AccountSnacksQuery.Snack> {
    return Paginator(
      fetch = { limit, offset ->
        apolloClient.query(
          Home_AccountSnacksQuery(
            accountName = accountName,
            limit = limit,
            offset = offset
          )
        )
          .execute()
          .dataOrThrow()
          .account
          .byName
          .snacks
      }
    )
  }

 suspend fun primaryAccount(): Home_ViewerPrimaryAccountNameQuery.PrimaryAccount? {
    return apolloClient.query(
      Home_ViewerPrimaryAccountNameQuery()
    )
      .execute()
      .dataOrThrow()
      .meUserActor
      ?.primaryAccount
  }
}
