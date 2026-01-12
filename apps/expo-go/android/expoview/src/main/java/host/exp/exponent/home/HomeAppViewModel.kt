package host.exp.exponent.home

import android.app.Activity
import android.app.Application
import android.content.Context
import androidx.activity.result.ActivityResultLauncher
import androidx.core.content.edit
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import com.google.android.play.core.review.ReviewManagerFactory
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import host.exp.exponent.analytics.EXL
import host.exp.exponent.apollo.Paginator
import host.exp.exponent.graphql.BranchDetailsQuery
import host.exp.exponent.graphql.BranchesForProjectQuery
import host.exp.exponent.graphql.Home_AccountAppsQuery
import host.exp.exponent.graphql.Home_AccountSnacksQuery
import host.exp.exponent.graphql.ProjectsQuery
import host.exp.exponent.graphql.fragment.CurrentUserActorData
import host.exp.exponent.home.auth.AuthRequestType
import host.exp.exponent.kernel.ExpoViewKernel
import host.exp.exponent.services.ApolloClientService
import host.exp.exponent.services.ExponentHistoryService
import host.exp.exponent.services.RESTApiClient
import host.exp.exponent.services.SessionRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.ExperimentalForInheritanceCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.FlowCollector
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onCompletion
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import okhttp3.OkHttpClient
import java.util.Date
import kotlin.reflect.typeOf
import kotlin.time.DurationUnit
import kotlin.time.toDuration
import kotlin.time.toJavaDuration

enum class DevSessionPlatform {
  Native,
  Web
}

enum class DevSessionSource {
  Desktop,
  Snack
}

data class DevSession(
  val description: String,
  val url: String,
  val source: DevSessionSource,
  val hostname: String? = null,
  val config: Map<String, Any>? = null,
  val platform: DevSessionPlatform? = null
)

data class DevSessionResponse(
  val data: List<DevSession>
)

private const val USER_REVIEW_INFO_PREFS_KEY = "userReviewInfo"

data class UserReviewState(
  val shouldShow: Boolean = false
)

private data class UserReviewInfo(
  val askedForNativeReviewDate: Long? = null,
  val lastDismissDate: Long? = null,
  val showFeedbackFormDate: Long? = null,
  val appOpenedCounter: Int = 0
)

data class FeedbackState(
  val isSubmitting: Boolean = false,
  val isSubmitted: Boolean = false,
  val error: String? = null
)

@Serializable
data class FeedbackBody(
  val feedback: String,
  val email: String?,
  val metadata: Map<String, String?>
)

fun Int.toJDuration(unit: DurationUnit) = this.toDuration(unit).toJavaDuration()

class HomeAppViewModelFactory(
  private val exponentHistoryService: ExponentHistoryService,
  private val expoViewKernel: ExpoViewKernel,
  private val homeActivityEvents: MutableSharedFlow<HomeActivityEvent>,
  private val authLauncher: ActivityResultLauncher<AuthRequestType>
) : ViewModelProvider.Factory {
  @Suppress("UNCHECKED_CAST")
  override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
    if (modelClass.isAssignableFrom(HomeAppViewModel::class.java)) {
      val application =
        checkNotNull(extras[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY])
      return HomeAppViewModel(
        application,
        exponentHistoryService,
        expoViewKernel,
        homeActivityEvents,
        authLauncher
      ) as T
    }
    throw IllegalArgumentException("Unknown ViewModel class")
  }
}

class HomeAppViewModel(
  application: Application,
  private val exponentHistoryService: ExponentHistoryService,
  expoViewKernel: ExpoViewKernel,
  homeActivityEvents: MutableSharedFlow<HomeActivityEvent>,
  private val authLauncher: ActivityResultLauncher<AuthRequestType>
) : AndroidViewModel(application) {

  val userReviewState = MutableStateFlow(UserReviewState())

  private val userReviewPrefs = application.getSharedPreferences(
    USER_REVIEW_INFO_PREFS_KEY,
    Context.MODE_PRIVATE
  )

  private val gson: Gson =
    GsonBuilder().create()

  private var lastCrashDate: Long? = null

  private val client = OkHttpClient
    .Builder()
    .connectTimeout(10.toJDuration(DurationUnit.SECONDS))
    .readTimeout(10.toJDuration(DurationUnit.SECONDS))
    .writeTimeout(10.toJDuration(DurationUnit.SECONDS))
    .build()

  val recents = exponentHistoryService.history
  val sessionRepository = SessionRepository(context = application)

  val expoVersion = expoViewKernel.versionName

  val isDevice =
    !(android.os.Build.MODEL.contains("google_sdk") || android.os.Build.MODEL.contains("Emulator"))

  val service = ApolloClientService(client, sessionRepository)
  private val restClient =
    RESTApiClient(sessionRepository = sessionRepository)

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

  val selectedTheme = persistedMutableStateFlow(
    scope = viewModelScope,
    readValue = { sessionRepository.getThemeSetting() },
    writeValue = { value ->
      sessionRepository.saveThemeSetting(value)
    }
  )

  val feedbackState = MutableStateFlow(FeedbackState())

  val developmentServers: StateFlow<List<DevSession>> = flow {
    while (true) {
      try {
        val sessions = restClient.sendAuthenticatedApiV2Request<DevSessionResponse>(
          "development-sessions",
          typeOf<DevSessionResponse>()
        )
        emit(sessions.data)
      } catch (_: Exception) {
        emit(emptyList())
      }
      delay(3000)
    }
  }.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
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
      if (currentUserData == null) {
        return@combine null
      }

      if (id == null) {
        return@combine currentUserData.accounts.firstOrNull()
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
      fetcher = { _ ->
        flow<Paginator<BranchesForProjectQuery.UpdateBranch>> {
          emit(service.branches(appId = appId))
        }
      },
      initialValue = null
    )
  }

  val snacks = refreshableFlow(
    scope = viewModelScope,
    externalTrigger = selectedAccount,
    fetcher = { account -> service.snacks(account?.name ?: "", count = 5) },
    initialValue = emptyList()
  )

  fun login() {
    authLauncher.launch(AuthRequestType.LOGIN)
  }

  fun onNewAuthSession(sessionSecret: String) {
    sessionRepository.saveSessionSecret(sessionSecret)
    account.refresh()
  }

  init {
    homeActivityEvents
      .onEach { event ->
        when (event) {
          is HomeActivityEvent.AccountDeleted -> {
            logout()
          }
        }
      }
      .launchIn(viewModelScope)
    lastCrashDate = exponentHistoryService.getLastCrashDate()

    combine(
      apps.dataFlow,
      snacks.dataFlow
    ) { appsList, snacksList ->
      updateUserReviewState(appsList.size, snacksList.size)
    }.launchIn(viewModelScope)
  }

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

  fun logout() {
    sessionRepository.clearSessionSecret()
    account.refresh()
//        TODO: is there a way to logout browser session too?
  }

  fun clearRecents() {
    exponentHistoryService.clearHistory()
  }

  fun selectAccount(accountId: String?) {
    selectedAccountId.value = accountId
  }

  fun sendFeedback(feedback: String, email: String) {
    viewModelScope.launch {
      feedbackState.update { it.copy(isSubmitting = true, error = null) }
      try {
        if (
          email.isNotBlank() &&
          !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
        ) {
          throw Exception("Please enter a valid email address.")
        }

        val metadata = mapOf(
          "os" to "${android.os.Build.VERSION.RELEASE}",
          "model" to android.os.Build.MODEL,
          "expoGoVersion" to expoVersion
        )

        val body = FeedbackBody(feedback, email, metadata)

        restClient.sendUnauthenticatedApiV2Request<Unit, FeedbackBody>(
          "feedback/expo-go-send",
          typeOf<Unit>(),
          body
        )
        feedbackState.update { it.copy(isSubmitting = false, isSubmitted = true) }
      } catch (e: Exception) {
        feedbackState.update { it.copy(isSubmitting = false, error = e.message) }
      }
    }
  }

  fun resetFeedbackState() {
    feedbackState.value = FeedbackState()
  }

  fun scanQR(
    context: Context,
    onSuccess: (String) -> Unit,
    onError: (String) -> Unit = {}
  ) {
    val options = GmsBarcodeScannerOptions
      .Builder()
      .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
      .build()

    val scanner = GmsBarcodeScanning.getClient(context, options)

    scanner.startScan()
      .addOnSuccessListener { barcode ->
        val url = barcode.rawValue ?: run {
          onError("No QR code data found")
          return@addOnSuccessListener
        }
        onSuccess(url)
      }
      .addOnCanceledListener {
        onError("QR code scan cancelled")
      }
      .addOnFailureListener { exception ->
        onError("QR code scan failed: ${exception.message ?: "Unknown error"}")
      }
  }

  /**
   * We should only prompt users to review the app if they seem to be
   * having a good experience, to check that we verify if the user
   * has not experienced any crashes in the last hour, and has at least
   * 5 apps or 5 snacks or has opened the app at least 50 times.
   * If the user dismisses the review section, we only show it again
   * after 15 days.
   */
  private suspend fun updateUserReviewState(appsCount: Int, snacksCount: Int) {
    val context = getApplication<Application>()

    val isStoreReviewAvailable = withContext(Dispatchers.IO) {
      if (!isDevice) return@withContext false
      try {
        ReviewManagerFactory.create(context)
        true
      } catch (_: Exception) {
        false
      }
    }

    val info = withContext(Dispatchers.IO) {
      val json = userReviewPrefs.getString(USER_REVIEW_INFO_PREFS_KEY, null)
      json?.let { gson.fromJson(it, UserReviewInfo::class.java) } ?: UserReviewInfo()
    }

    val timeNow = Date()
    val noRecentCrashes = lastCrashDate?.let { timeNow.time - it > 60 * 60 * 1000 } ?: true
    val noRecentDismisses =
      info.lastDismissDate?.let { timeNow.time - it > 15L * 24 * 60 * 60 * 1000 } ?: true

    val shouldShow = isStoreReviewAvailable &&
      info.askedForNativeReviewDate == null &&
      info.showFeedbackFormDate == null &&
      noRecentCrashes &&
      noRecentDismisses &&
      (info.appOpenedCounter >= 50 || appsCount >= 5 || snacksCount >= 5)

    userReviewState.update { it.copy(shouldShow = shouldShow) }
  }

  fun requestStoreReview(activity: Activity) {
    updateUserReviewInfo { it.copy(askedForNativeReviewDate = Date().time) }
    val manager = ReviewManagerFactory.create(activity)
    manager.requestReviewFlow().addOnCompleteListener { task ->
      if (task.isSuccessful) {
        manager.launchReviewFlow(activity, task.result)
      } else {
        EXL.e("HomeAppViewModel", "Failed to launch in-app review: ${task.exception?.message}")
      }
    }
    userReviewState.update { it.copy(shouldShow = false) }
  }

  fun dismissReviewSection() {
    updateUserReviewInfo { it.copy(lastDismissDate = Date().time) }
    userReviewState.update { it.copy(shouldShow = false) }
  }

  fun provideFeedback() {
    updateUserReviewInfo { it.copy(showFeedbackFormDate = Date().time) }
    userReviewState.update { it.copy(shouldShow = false) }
    // Navigation should be handled in the Composable
  }

  private fun updateUserReviewInfo(updateAction: (UserReviewInfo) -> UserReviewInfo) {
    viewModelScope.launch(Dispatchers.IO) {
      val currentInfo =
        userReviewPrefs.getString(USER_REVIEW_INFO_PREFS_KEY, null)
          ?.let { gson.fromJson(it, UserReviewInfo::class.java) }
          ?: UserReviewInfo()
      val newInfo = updateAction(currentInfo)
      userReviewPrefs.edit(commit = true) {
        putString(USER_REVIEW_INFO_PREFS_KEY, gson.toJson(newInfo))
      }
      updateUserReviewState(apps.dataFlow.value.size, snacks.dataFlow.value.size)
    }
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
  writeValue: (T) -> Unit
): MutableStateFlow<T> {
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
