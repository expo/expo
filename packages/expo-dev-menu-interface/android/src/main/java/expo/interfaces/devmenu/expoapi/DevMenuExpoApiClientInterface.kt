package expo.interfaces.devmenu.expoapi

data class Response<T>(
  val status: Int,
  val data: T?
)

data class DevMenuGraphQLOptions(
  val limit: Int = 10,
  val offset: Int = 0
)

interface DevMenuExpoApiClientInterface {
  fun isLoggedIn(): Boolean
  fun setSessionSecret(newSessionSecret: String?)
  suspend fun queryMyProjects(options: DevMenuGraphQLOptions = DevMenuGraphQLOptions()): okhttp3.Response
  suspend fun queryDevSessions(): okhttp3.Response
  suspend fun queryUpdateChannels(
    appId: String,
    options: DevMenuGraphQLOptions = DevMenuGraphQLOptions()
  ): Response<List<DevMenuEASUpdates.Channel>>
  suspend fun queryUpdateBranches(
    appId: String,
    branchesOptions: DevMenuGraphQLOptions = DevMenuGraphQLOptions(),
    updatesOptions: DevMenuGraphQLOptions = DevMenuGraphQLOptions()
  ): Response<List<DevMenuEASUpdates.Branch>>
}
