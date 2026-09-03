package host.exp.exponent.services

import com.apollographql.apollo.ApolloClient
import com.apollographql.apollo.api.Optional
import com.apollographql.apollo.cache.normalized.FetchPolicy
import com.apollographql.apollo.cache.normalized.api.MemoryCacheFactory
import com.apollographql.apollo.cache.normalized.fetchPolicy
import com.apollographql.apollo.cache.normalized.normalizedCache
import com.apollographql.apollo.network.okHttpClient
import host.exp.exponent.apollo.AuthInterceptor
import host.exp.exponent.apollo.CursorPage
import host.exp.exponent.apollo.CursorPaginator
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
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.last
import kotlinx.coroutines.flow.map
import okhttp3.OkHttpClient

class ApolloClientService(
  httpClient: OkHttpClient,
  sessionRepository: SessionRepository
) {
  private val normalizedCacheFactory = MemoryCacheFactory(maxSizeBytes = 10 * 1024 * 1024)

  private val apolloClient = ApolloClient
    .Builder()
    .serverUrl("https://exp.host/--/graphql")
    .okHttpClient(httpClient)
    .normalizedCache(normalizedCacheFactory)
    .addHttpInterceptor(AuthInterceptor(sessionRepository))
    .fetchPolicy(FetchPolicy.CacheAndNetwork)
    .build()

  fun currentUser(): Flow<CurrentUserActorData?> {
    return apolloClient.query(Home_CurrentUserActorQuery())
      .toFlow()
      .map { response ->
        response.data?.meUserActor?.currentUserActorData
      }
  }

  fun branchDetails(
    name: String,
    appId: String
  ): Flow<BranchDetailsQuery.ById?> {
    return apolloClient.query(
      BranchDetailsQuery(
        name = name,
        appId = appId,
        platform = AppPlatform.ANDROID
      )
    )
      .toFlow().map {
        it.data?.app?.byId
      }
  }

  fun branches(
    appId: String
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
          .toFlow().last()
          .dataOrThrow()
          .app
          .byId
          .updateBranches
      }
    )
  }

  fun branches(
    appId: String,
    count: Int
  ): Flow<List<BranchesForProjectQuery.UpdateBranch>> {
    return apolloClient.query(
      BranchesForProjectQuery(
        appId = appId,
        platform = AppPlatform.ANDROID,
        limit = count,
        offset = 0
      )
    )
      .toFlow().map {
        it.data?.app?.byId?.updateBranches ?: emptyList()
      }
  }

  fun apps(
    accountName: String
  ): CursorPaginator<Home_AccountAppsQuery.Node> {
    return CursorPaginator(
      fetch = { first, after ->
        val connection = apolloClient.query(
          Home_AccountAppsQuery(
            accountName = accountName,
            platform = AppPlatform.ANDROID,
            first = first,
            after = Optional.presentIfNotNull(after)
          )
        )
          .toFlow().last()
          .dataOrThrow()
          .account
          .byName
          .appsPaginated
        CursorPage(
          items = connection.edges.map { it.node },
          hasNextPage = connection.pageInfo.hasNextPage,
          endCursor = connection.pageInfo.endCursor
        )
      }
    )
  }

  fun apps(accountName: String, count: Int = 10): Flow<List<Home_AccountAppsQuery.Node>> {
    return apolloClient.query(
      Home_AccountAppsQuery(
        accountName = accountName,
        platform = AppPlatform.ANDROID,
        first = count,
        after = Optional.absent()
      )
    ).toFlow()
      .map { response ->
        response.data?.account?.byName?.appsPaginated?.edges?.map { it.node } ?: emptyList()
      }
  }

  fun app(appId: String): Flow<ProjectsQuery.ById?> {
    return apolloClient.query(
      ProjectsQuery(
        appId = appId,
        platform = AppPlatform.ANDROID
      )
    ).toFlow()
      .map { response ->
        response.data?.app?.byId
      }
  }

  fun snacks(
    accountName: String
  ): CursorPaginator<Home_AccountSnacksQuery.Node> {
    return CursorPaginator(
      fetch = { first, after ->
        val connection = apolloClient.query(
          Home_AccountSnacksQuery(
            accountName = accountName,
            first = first,
            after = Optional.presentIfNotNull(after)
          )
        )
          .toFlow().last().dataOrThrow().account.byName.snacksPaginated
        CursorPage(
          items = connection.edges.map { it.node },
          hasNextPage = connection.pageInfo.hasNextPage,
          endCursor = connection.pageInfo.endCursor
        )
      }
    )
  }

  fun snacks(accountName: String, count: Int = 10): Flow<List<Home_AccountSnacksQuery.Node>> {
    return apolloClient.query(
      Home_AccountSnacksQuery(
        accountName = accountName,
        first = count,
        after = Optional.absent()
      )
    ).toFlow()
      .map { response ->
        response.data?.account?.byName?.snacksPaginated?.edges?.map { it.node } ?: emptyList()
      }
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
