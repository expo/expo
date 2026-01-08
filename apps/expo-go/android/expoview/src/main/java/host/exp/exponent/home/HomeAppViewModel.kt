package host.exp.exponent.home

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import host.exp.exponent.apollo.Paginator
import host.exp.exponent.graphql.BranchDetailsQuery
import host.exp.exponent.graphql.BranchesForProjectQuery
import host.exp.exponent.graphql.Home_AccountAppsQuery
import host.exp.exponent.graphql.Home_AccountSnacksQuery
import host.exp.exponent.graphql.ProjectsQuery
import host.exp.exponent.graphql.fragment.CurrentUserActorData
import host.exp.exponent.services.ApolloClientService
import host.exp.exponent.services.AuthSessionType
import host.exp.exponent.services.SessionRepository
import host.exp.exponent.services.launchAuthSession
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.ExperimentalForInheritanceCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.FlowCollector
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.onCompletion
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import kotlin.time.DurationUnit
import kotlin.time.toDuration
import kotlin.time.toJavaDuration

// Enums to match the TypeScript union types
enum class DevSessionPlatform {
  Native, Web
}

enum class DevSessionSource {
  Desktop, Snack
}

// The Data Class representing the TypeScript type
data class DevSession(
  val description: String,
  val url: String,
  val source: DevSessionSource,
  val hostname: String? = null,
  // 'object' in TS is best represented as a Map or a generic JSON element in Kotlin
  val config: Map<String, Any>? = null,
  val platform: DevSessionPlatform? = null
)

data class HistoryItem(
  val manifest: String?,
  val url: String,
  val time: Long
)

fun Int.toJDuration(unit: DurationUnit) = this.toDuration(unit).toJavaDuration()

class HomeAppViewModel(application: Application) : AndroidViewModel(application) {
  private val client = OkHttpClient
    .Builder()
    .connectTimeout(10.toJDuration(DurationUnit.SECONDS))
    .readTimeout(10.toJDuration(DurationUnit.SECONDS))
    .writeTimeout(10.toJDuration(DurationUnit.SECONDS))
    .build()

  val sessionRepository = SessionRepository(context = application)

  val service = ApolloClientService(client, sessionRepository)

  val sessions = MutableStateFlow<List<DevSession>>(emptyList())

  val account = refreshableFlow(
    scope = viewModelScope,
    fetcher = { service.currentUser() },
    initialValue = null
  )

  private val selectedAccountId = persistedMutableStateFlow(
    scope = viewModelScope,
    readValue = { sessionRepository.getSelectedAccountId() },
    writeValue = { value ->
      if (value == null) {
        sessionRepository.clearSelectedAccountId()
      } else {
        sessionRepository.saveSelectedAccountId(value)
      }
    }
  )

  fun branch(branchName: String, appId: String): RefreshableFlow<BranchDetailsQuery.ById?> {
    return refreshableFlow(scope = viewModelScope, fetcher = {
      service.branchDetails(branchName, appId)
    }, initialValue = null)
  }

  fun branches(appId: String?, count: Int): Flow<List<BranchesForProjectQuery.UpdateBranch>> {
    return if (appId == null) {
      flow { emit(emptyList()) }
    } else {
      service.branches(appId, count)
    }
  }

  val selectedAccount: StateFlow<CurrentUserActorData.Account?> =
    selectedAccountId.combine(account.dataFlow) { id, currentUserData ->
      if (id == null || currentUserData == null) {
        return@combine null
      }
      currentUserData.accounts.find { it.id == id }
    }.stateIn(
      scope = viewModelScope,
      started = SharingStarted.WhileSubscribed(5000),
      initialValue = null
    )

  val apps = refreshableFlow(
    scope = viewModelScope,
    externalTrigger = selectedAccount,
    fetcher = { account -> service.apps(account?.name ?: "", count = 5) },
    initialValue = emptyList()
  )

  val appsPaginatorRefreshableFlow =
    refreshableFlow(
      scope = viewModelScope,
      externalTrigger = selectedAccount,
      fetcher = { account ->
        flow<Paginator<Home_AccountAppsQuery.App>> {
          val paginator = service.apps(account?.name ?: "")

          emit(paginator)
        }
      },
      initialValue = null
    )

  fun app(appId: String): Flow<ProjectsQuery.ById?> {
    return service.app(appId)
  }

  fun branchesPaginatorRefreshableFlow(appId: String): RefreshableFlow<Paginator<BranchesForProjectQuery.UpdateBranch>?> {
    return refreshableFlow(
      scope = viewModelScope,
      externalTrigger = selectedAccount,
      fetcher = { account ->
        flow<Paginator<BranchesForProjectQuery.UpdateBranch>> {
          emit(service.branches(appId = appId))
        }
      },
      initialValue = null
    )
  }

  val recents = persistedMutableStateFlow(
    viewModelScope,
    readValue = { sessionRepository.getRecents() },
    writeValue = { sessionRepository.saveRecents(it) }
  )

  val snacks = refreshableFlow(
    scope = viewModelScope,
    externalTrigger = selectedAccount,
    fetcher = { account -> service.snacks(account?.name ?: "", count = 5) },
    initialValue = emptyList()
  )

  val snacksPaginatorRefreshableFlow =
    refreshableFlow(
      scope = viewModelScope,
      externalTrigger = selectedAccount,
      fetcher = { account ->
        flow<Paginator<Home_AccountSnacksQuery.Snack>> {
          emit(service.snacks(account?.name ?: ""))
        }
      },
      initialValue = null
    )

  init {
    loadSessions()
  }

  private fun loadSessions() {
    viewModelScope.launch {
      // Simulate fetching data
      val mockSessions = listOf(
        DevSession(
          description = "My First Project",
          url = "exp://192.168.1.5:8081",
          source = DevSessionSource.Desktop,
          platform = DevSessionPlatform.Native,
          hostname = "macbook-pro.local"
        ),
        DevSession(
          description = "Cool Snack",
          url = "exp://exp.host/@snack/sdk.49.0.0",
          source = DevSessionSource.Snack,
          platform = DevSessionPlatform.Web
        ),
        DevSession(
          description = "Cool Snack",
          url = "exp://exp.host/@snack/sdk.49.0.0",
          source = DevSessionSource.Snack,
          platform = DevSessionPlatform.Web
        ),
        DevSession(
          description = "Cool Snack",
          url = "exp://exp.host/@snack/sdk.49.0.0",
          source = DevSessionSource.Snack,
          platform = DevSessionPlatform.Web
        ),
        DevSession(
          description = "Cool Snack",
          url = "exp://exp.host/@snack/sdk.49.0.0",
          source = DevSessionSource.Snack,
          platform = DevSessionPlatform.Web
        )
      )
      sessions.value = mockSessions
    }
  }

  fun addSession(session: DevSession) {
    val currentList = sessions.value.toMutableList()
    currentList.add(session)
    sessions.value = currentList
  }

  fun login(context: Context) {
    launchAuthSession(
      context = context,
      type = AuthSessionType.LOGIN
    ) { secret ->
      sessionRepository.saveSessionSecret(secret)
      account.refresh()
    }
  }

  fun logout() {
    sessionRepository.clearSessionSecret()
    account.refresh()
//        TODO: logout browser session too
  }

  fun removeSession(url: String) {
    sessions.value = sessions.value.filter { it.url != url }
  }

  fun clearRecents() {
    recents.value = emptyList()
  }

  fun selectAccount(accountId: String?) {
    selectedAccountId.value = accountId
  }
}

class RefreshableFlow<T>(
  val dataFlow: StateFlow<T>,
  val loadingFlow: StateFlow<Boolean>,
  val refresh: () -> Unit
)

@OptIn(ExperimentalCoroutinesApi::class)
fun <T> refreshableFlow(
  scope: CoroutineScope,
  fetcher: () -> Flow<T>,
  initialValue: T
): RefreshableFlow<T> {
  val refreshTrigger = MutableSharedFlow<Unit>(replay = 1)
  val loadingState = MutableStateFlow(false)

  refreshTrigger.tryEmit(Unit)

  val stateFlow = refreshTrigger
    .flatMapLatest {
      fetcher()
        .onStart { loadingState.value = true }
        .onCompletion { loadingState.value = false }
    }
    .stateIn(
      scope = scope,
      started = SharingStarted.WhileSubscribed(5000),
      initialValue = initialValue
    )

  return RefreshableFlow(
    dataFlow = stateFlow,
    loadingFlow = loadingState,
    refresh = { refreshTrigger.tryEmit(Unit) }
  )
}

@OptIn(ExperimentalCoroutinesApi::class)
fun <T, U> refreshableFlow(
  scope: CoroutineScope,
  externalTrigger: Flow<T>,
  initialValue: U,
  fetcher: (T) -> Flow<U>
): RefreshableFlow<U> {
  val manualRefreshTrigger = MutableSharedFlow<Unit>(replay = 1)
  val loadingState = MutableStateFlow(false)

  // This is the key: it combines the external trigger (e.g., selectedAccount)
  // with a manual trigger, so both can cause a refresh.
  val combinedTrigger = externalTrigger.combine(
    manualRefreshTrigger.onStart { emit(Unit) }
  ) { triggerValue, _ ->
    triggerValue
  }

  val dataFlow = combinedTrigger
    .flatMapLatest { triggerValue ->
      fetcher(triggerValue)
        .onStart { loadingState.value = true }
        .onCompletion { loadingState.value = false }
    }
    .stateIn(
      scope = scope,
      started = SharingStarted.WhileSubscribed(5000),
      initialValue = initialValue
    )

  return RefreshableFlow(
    dataFlow = dataFlow,
    loadingFlow = loadingState,
    refresh = { manualRefreshTrigger.tryEmit(Unit) }
  )
}

@OptIn(ExperimentalForInheritanceCoroutinesApi::class)
fun <T> persistedMutableStateFlow(
  scope: CoroutineScope,
  readValue: () -> T,
  writeValue: (T) -> Unit,
): MutableStateFlow<T> {
  // This object implements the MutableStateFlow interface and delegates behavior
  // to an internal MutableStateFlow while adding the persistence logic.
  return object : MutableStateFlow<T> {

    private val _state = MutableStateFlow(readValue())

    override var value: T
      get() = _state.value
      set(value) {
        if (_state.value != value) {
          _state.value = value
          scope.launch { writeValue(value) }
        }
      }

    override val subscriptionCount: StateFlow<Int>
      get() = _state.subscriptionCount

    override fun compareAndSet(expect: T, update: T): Boolean {
      val result = _state.compareAndSet(expect, update)
      if (result) {
        scope.launch { writeValue(update) }
      }
      return result
    }

    override suspend fun emit(value: T) {
      _state.emit(value)
      writeValue(value)
    }

    override fun tryEmit(value: T): Boolean {
      val result = _state.tryEmit(value)
      if (result) {
        scope.launch { writeValue(value) }
      }
      return result
    }

    override val replayCache: List<T>
      get() = _state.replayCache

    @ExperimentalCoroutinesApi
    override fun resetReplayCache() {
      _state.resetReplayCache()
    }

    override suspend fun collect(collector: FlowCollector<T>): Nothing {
      _state.collect(collector)
    }
  }
}
