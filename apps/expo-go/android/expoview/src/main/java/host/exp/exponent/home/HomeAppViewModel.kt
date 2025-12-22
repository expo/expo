package host.exp.exponent.home

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.application
import androidx.lifecycle.viewModelScope
import androidx.work.await
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
import java.util.concurrent.TimeUnit
import host.exp.exponent.graphql.Home_AccountAppsQuery
import host.exp.exponent.graphql.Home_AccountAppsQuery.App
import host.exp.exponent.apollo.Paginator

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

class HomeAppViewModel(application: Application) : AndroidViewModel(application) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()

    val sessionRepository = SessionRepository(context = application)

    val service = ApolloClientService(client, sessionRepository)


    val sessions = MutableStateFlow<List<DevSession>>(emptyList())

    val account = refreshableFlow(scope = viewModelScope, fetcher = { service.currentUser() }, initialValue = null)

    private val selectedAccountId = persistedMutableStateFlow<String?>(
        scope = viewModelScope,
        readValue = { sessionRepository.getSelectedAccountId() },
        writeValue = { value -> if(value == null) {
            sessionRepository.clearSelectedAccountId()
        } else {
            sessionRepository.saveSelectedAccountId(value)
        } }
    )

    val selectedAccount: StateFlow<CurrentUserActorData.Account?> = selectedAccountId.combine(account.dataFlow) { id, currentUserData ->
        if(id == null || currentUserData == null) {
            return@combine null
        }
        currentUserData.accounts.find { it.id == id }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val apps = refreshableFlow(scope = viewModelScope, trigger = selectedAccount, fetcher = { account -> service.apps(account?.name ?: "", count = 5) }, initialValue = emptyList())

    val appsPaginator =
        refreshableFlow(scope = viewModelScope, trigger = selectedAccount, fetcher = { account ->
            flow<Paginator<Home_AccountAppsQuery.App>> {
                emit(service.apps(account?.name ?: ""))
            }
        }, initialValue = null)

    val recents = MutableStateFlow<List<DevSession>>(emptyList())
    val snacks = MutableStateFlow<List<DevSession>>(emptyList())

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
            recents.value = mockSessions.take(1)
//            apps.value = mockSessions// Just an example
        }
    }

    fun addSession(session: DevSession) {
        val currentList = sessions.value.toMutableList()
        currentList.add(session)
        sessions.value = currentList
    }

    fun login(context: Context) {
        launchAuthSession(context = context, type = AuthSessionType.LOGIN, { secret ->
        println("Received auth token: $secret")
        sessionRepository.saveSessionSecret(secret)
            account.refresh()
//       account.coll
        // For demonstration, we can set a mock account
        // In a real app, you would fetch user details using the token
    })
//        account.value = Account(username, "https://picsum.photos/200/200", "test@test.com")
    }

    fun logout() {
        sessionRepository.clearSessionSecret()
        account.refresh()
//        TODO: logout browser session too

//        account.value = null
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
        .stateIn<T>(
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
    trigger: Flow<T>,
    initialValue: U,
    fetcher: (T) -> Flow<U>
): RefreshableFlow<U> {
    val manualRefreshTrigger = MutableSharedFlow<Unit>(replay = 1)
    val loadingState = MutableStateFlow(false)

    // This is the key: it combines the external trigger (e.g., selectedAccount)
    // with a manual trigger, so both can cause a refresh.
    val combinedTrigger = trigger.combine(manualRefreshTrigger.onStart { emit(Unit) }) { triggerValue, _ ->
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
