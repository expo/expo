package expo.modules.devlauncher.compose.models

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.compose.Branch
import expo.modules.devlauncher.compose.Update
import expo.modules.devlauncher.services.AppService
import expo.modules.devlauncher.services.ApplicationInfo
import expo.modules.devlauncher.services.GraphQLService
import expo.modules.devlauncher.services.SessionService
import expo.modules.devlauncher.services.UpdateBranch
import expo.modules.devlauncher.services.UserState
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted.Companion.WhileSubscribed
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface BranchesAction {
  object LoadMoreBranches : BranchesAction
  class OpenBranch(val branchName: String) : BranchesAction
  class Search(val query: String) : BranchesAction
}

data class BranchesState(
  val branches: List<Branch> = emptyList(),
  val isLoading: Boolean = false,
  val isLoadingMore: Boolean = false,
  val hasMore: Boolean = false,
  val searchQuery: String = "",
  val needToSignIn: Boolean = false
)

class BranchesViewModel : ViewModel() {
  private val graphQLService = inject<GraphQLService>()
  private val appService = inject<AppService>()
  private val sessionService = inject<SessionService>()

  private var cursor: String? = null
  private var hasMore = true
  private var searchJob: Job? = null

  val areUpdatesConfigured get() = appService.applicationInfo is ApplicationInfo.Updates

  private var _state = MutableStateFlow(
    BranchesState(
      branches = emptyList(),
      isLoading = areUpdatesConfigured,
      needToSignIn = sessionService.user.value == UserState.LoggedOut
    )
  )

  private val _sessionState = sessionService.user.onEach { newUser ->
    when (newUser) {
      UserState.LoggedOut -> {
        hasMore = false
        cursor = null
        _state.value = _state.value.copy(
          branches = emptyList(),
          isLoading = false,
          isLoadingMore = false,
          hasMore = false
        )
      }

      is UserState.LoggedIn -> {
        if (areUpdatesConfigured) {
          _state.value = _state.value.copy(
            branches = emptyList(),
            isLoading = true
          )
          viewModelScope.launch {
            loadBranches(reset = true)
          }
        }
      }

      is UserState.Fetching -> {
        _state.value = _state.value.copy(
          isLoading = true,
          branches = emptyList()
        )
      }
    }
  }

  val state = _state
    .combine(_sessionState) { branchState, newUser ->
      when (newUser) {
        UserState.Fetching -> {
          branchState.copy(needToSignIn = false)
        }

        UserState.LoggedOut -> {
          branchState.copy(needToSignIn = true)
        }

        is UserState.LoggedIn -> {
          branchState.copy(needToSignIn = false)
        }
      }
    }.stateIn(
      scope = viewModelScope,
      started = WhileSubscribed(5_000),
      initialValue = _state.value
    )

  /**
   * Loads a page of branches. When [reset] is true the list restarts from the first page,
   * which is what a new search term or a fresh sign-in needs.
   */
  private suspend fun loadBranches(reset: Boolean) {
    val updateConfiguration = appService.applicationInfo as? ApplicationInfo.Updates

    // If the app is not configured for updates, we don't need to fetch branches.
    if (updateConfiguration == null) {
      return
    }

    if (!reset && !hasMore) {
      return
    }

    if (reset) {
      cursor = null
      hasMore = true
    }

    val requestedQuery = _state.value.searchQuery
    val searchTerm = requestedQuery.trim().takeIf { it.isNotEmpty() }
    val runtimeVersion = updateConfiguration.runtimeVersion

    _state.value = _state.value.copy(
      isLoading = reset,
      isLoadingMore = !reset
    )

    val response = if (runtimeVersion != null) {
      graphQLService.fetchBranches(
        appId = updateConfiguration.appId,
        runtimeVersion = runtimeVersion,
        first = PAGE_SIZE,
        after = cursor,
        searchTerm = searchTerm
      )
    } else {
      graphQLService.fetchBranches(
        appId = updateConfiguration.appId,
        first = PAGE_SIZE,
        after = cursor,
        searchTerm = searchTerm
      )
    }

    // A newer search term replaced this request while it was in flight.
    if (requestedQuery != _state.value.searchQuery) {
      return
    }

    val branches = response.data
      ?.updateBranches
      ?.map { it.toBranch(hasRuntimeVersion = runtimeVersion != null) }
      ?: emptyList()

    cursor = response.data?.endCursor ?: cursor
    hasMore = response.data?.hasNextPage ?: false

    _state.value = _state.value.copy(
      isLoading = false,
      isLoadingMore = false,
      hasMore = hasMore,
      branches = if (reset) branches else _state.value.branches + branches
    )
  }

  fun onAction(action: BranchesAction) {
    when (action) {
      BranchesAction.LoadMoreBranches -> {
        if (_state.value.isLoading || _state.value.isLoadingMore) {
          return
        }
        viewModelScope.launch { loadBranches(reset = false) }
      }

      is BranchesAction.Search -> {
        if (action.query == _state.value.searchQuery) {
          return
        }
        _state.value = _state.value.copy(searchQuery = action.query)
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
          delay(SEARCH_DEBOUNCE_MS)
          loadBranches(reset = true)
        }
      }

      is BranchesAction.OpenBranch -> throw IllegalStateException("Opening branches should be handled in the screen, not in the ViewModel.")
    }
  }

  private fun UpdateBranch.toBranch(hasRuntimeVersion: Boolean): Branch {
    if (!hasRuntimeVersion) {
      return Branch(name = name, compatibleUpdate = null)
    }

    return Branch(
      name = name,
      compatibleUpdate = compatibleUpdates.firstOrNull()?.let { update ->
        Update(
          id = update.id,
          name = update.message ?: "No message",
          createdAt = update.createdAt,
          isCompatible = true,
          permalink = update.manifestPermalink
        )
      }
    )
  }

  companion object {
    private const val PAGE_SIZE = 20

    /** How long to wait after the last keystroke before querying the server. */
    private const val SEARCH_DEBOUNCE_MS = 300L
  }
}
