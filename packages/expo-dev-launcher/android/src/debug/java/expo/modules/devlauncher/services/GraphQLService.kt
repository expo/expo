package expo.modules.devlauncher.services

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import expo.modules.devlauncher.helpers.await
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

const val graphQLEndpoint = "https://exp.host/--/graphql"

private val jsonMediaType = "application/json".toMediaType()

private const val ME_QUERY = """
query Me {
  meUserActor {
    id
    appCount
    profilePhoto
    username
    isExpoAdmin
    accounts {
      id
      name
      ownerUserActor {
        username
        fullName
        profilePhoto
      }
    }
  }
}
"""

private const val GET_BRANCHES_WITH_COMPATIBLE_UPDATE_QUERY = """
query getBranchesWithCompatibleUpdate(
  ${'$'}appId: String!
  ${'$'}offset: Int!
  ${'$'}limit: Int!
  ${'$'}runtimeVersion: String!
  ${'$'}platform: AppPlatform!
) {
  app {
    byId(appId: ${'$'}appId) {
      updateBranches(offset: ${'$'}offset, limit: ${'$'}limit) {
        id
        name

        compatibleUpdates: updates(
          offset: 0
          limit: 1
          filter: { runtimeVersions: [${'$'}runtimeVersion], platform: ${'$'}platform }
        ) {
          id
          message
          runtimeVersion
          createdAt
          manifestPermalink
        }
      }
    }
  }
}
"""

private const val GET_BRANCHES_QUERY = """
query getBranches(
  ${'$'}appId: String!
  ${'$'}offset: Int!
  ${'$'}limit: Int!
  ${'$'}platform: AppPlatform!
) {
  app {
    byId(appId: ${'$'}appId) {
      updateBranches(offset: ${'$'}offset, limit: ${'$'}limit) {
        id
        name
      }
    }
  }
}
"""

private const val GET_UPDATES_WITH_FILTERS_QUERY = """
query getUpdatesWithFilters(
  ${'$'}appId: String!
  ${'$'}branchName: String!
  ${'$'}offset: Int!
  ${'$'}limit: Int!
  ${'$'}platform: AppPlatform!
) {
  app {
    byId(appId: ${'$'}appId) {
      updateBranchByName(name: ${'$'}branchName) {
        updates(offset: ${'$'}offset, limit: ${'$'}limit, filter: { platform: ${'$'}platform }) {
          id
          message
          runtimeVersion
          createdAt
          manifestPermalink
        }
      }
    }
  }
}
"""

data class GraphQLResponse<T>(
  val data: T? = null,
  val errors: List<GraphQLError>? = null
) {
  fun hasErrors() = !errors.isNullOrEmpty()
}

data class GraphQLError(val message: String? = null)

// Me
data class MeData(val meUserActor: MeUserActor? = null) {
  val accounts: List<UserAccount>
    get() = meUserActor?.accounts ?: emptyList()
}

data class MeUserActor(
  val id: String,
  val username: String? = null,
  val accounts: List<UserAccount> = emptyList()
)

data class UserAccount(
  val id: String,
  val name: String,
  val ownerUserActor: OwnerUserActor? = null
)

data class OwnerUserActor(val profilePhoto: String? = null)

// branches (covers both getBranches and getBranchesWithCompatibleUpdate)
data class BranchesData(val app: BranchesApp? = null) {
  val updateBranches: List<UpdateBranch>
    get() = app?.byId?.updateBranches ?: emptyList()
}

data class BranchesApp(val byId: BranchesById? = null)
data class BranchesById(val updateBranches: List<UpdateBranch> = emptyList())
data class UpdateBranch(
  val id: String,
  val name: String,
  val compatibleUpdates: List<UpdateInfo> = emptyList()
)

// updates
data class UpdatesData(val app: UpdatesApp? = null) {
  val updates: List<UpdateInfo>
    get() = app?.byId?.updateBranchByName?.updates ?: emptyList()
}

data class UpdatesApp(val byId: UpdatesById? = null)
data class UpdatesById(val updateBranchByName: UpdateBranchByName? = null)
data class UpdateBranchByName(val updates: List<UpdateInfo> = emptyList())

// shared update shape
data class UpdateInfo(
  val id: String,
  val message: String? = null,
  val runtimeVersion: String? = null,
  val createdAt: String? = null,
  val manifestPermalink: String
)

class GraphQLService(
  private val httpClientService: HttpClientService
) {
  private val gson = Gson()

  private inline fun <reified T> Gson.fromJsonTyped(text: String): T =
    fromJson(text, object : TypeToken<T>() {}.type)

  private suspend inline fun <reified T> execute(
    query: String,
    variables: Map<String, Any?>
  ): GraphQLResponse<T> {
    val payload = gson.toJson(mapOf("query" to query, "variables" to variables))
    val request = Request
      .Builder()
      .url(graphQLEndpoint)
      .header("Content-Type", "application/json")
      .post(payload.toRequestBody(jsonMediaType))
      .build()

    val response = request.await(httpClientService.httpClient)
    if (!response.isSuccessful) {
      throw IllegalStateException("GraphQL request failed: ${response.code} ${response.message}")
    }

    val body = response.body?.string()
      ?: throw IllegalStateException("GraphQL request returned an empty response body")

    return gson.fromJsonTyped(body)
  }

  suspend fun fetchMe(): GraphQLResponse<MeData> {
    return execute(ME_QUERY, emptyMap())
  }

  suspend fun fetchBranches(
    appId: String,
    runtimeVersion: String,
    offset: Int = 0,
    limit: Int = 50
  ): GraphQLResponse<BranchesData> {
    return execute(
      GET_BRANCHES_WITH_COMPATIBLE_UPDATE_QUERY,
      mapOf(
        "appId" to appId,
        "offset" to offset,
        "limit" to limit,
        "runtimeVersion" to runtimeVersion,
        "platform" to "ANDROID"
      )
    )
  }

  suspend fun fetchBranches(
    appId: String,
    offset: Int = 0,
    limit: Int = 50
  ): GraphQLResponse<BranchesData> {
    return execute(
      GET_BRANCHES_QUERY,
      mapOf(
        "appId" to appId,
        "offset" to offset,
        "limit" to limit,
        "platform" to "ANDROID"
      )
    )
  }

  suspend fun fetchUpdates(
    appId: String,
    branchName: String,
    offset: Int = 0,
    limit: Int = 50
  ): GraphQLResponse<UpdatesData> {
    return execute(
      GET_UPDATES_WITH_FILTERS_QUERY,
      mapOf(
        "appId" to appId,
        "branchName" to branchName,
        "offset" to offset,
        "limit" to limit,
        "platform" to "ANDROID"
      )
    )
  }
}
