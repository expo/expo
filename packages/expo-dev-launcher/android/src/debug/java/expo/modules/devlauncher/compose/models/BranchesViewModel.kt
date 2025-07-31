package expo.modules.devlauncher.compose.models

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.compose.Branch
import expo.modules.devlauncher.compose.Update
import expo.modules.devlauncher.services.ApolloClientService
import expo.modules.devlauncher.services.AppService
import expo.modules.devlauncher.services.ApplicationInfo
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted.Companion.WhileSubscribed
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface BranchesAction {
  object LoadMoreBranches : BranchesAction
  class OpenBranch(val branchName: String) : BranchesAction
}

data class BranchesState(
  val branches: List<Branch> = emptyList(),
  val isLoading: Boolean = false
)

class BranchesViewModel : ViewModel() {
  private val apolloClientService = inject<ApolloClientService>()
  private val appService = inject<AppService>()

  private val hasMore = mutableStateOf(true)

  val areUpdatesConfigured get() = appService.applicationInfo is ApplicationInfo.Updates

  private var _state = MutableStateFlow(
    BranchesState(
      branches = emptyList(),
      isLoading = areUpdatesConfigured
    )
  )

  val state = _state.onStart {
    if (areUpdatesConfigured) {
      hasMore.value = true
      loadMoreBranches()
    }
  }.stateIn(
    scope = viewModelScope,
    started = WhileSubscribed(5_000),
    initialValue = _state.value
  )

  private suspend fun loadMoreBranches() {
    val updateConfiguration = appService.applicationInfo as? ApplicationInfo.Updates

    // If the app is not configured for updates, we don't need to fetch branches.
    if (updateConfiguration == null || !hasMore.value) {
      return
    }

    val appId = updateConfiguration.appId
    val runtimeVersion = updateConfiguration.runtimeVersion
    val limit = 50

    val branches = if (runtimeVersion != null) {
      apolloClientService.fetchBranches(
        appId = appId,
        runtimeVersion = runtimeVersion,
        offset = _state.value.branches.size,
        limit = limit
      ).data?.app?.byId?.updateBranches?.map { updateBranch ->
        Branch(
          name = updateBranch.name,
          compatibleUpdate = updateBranch.compatibleUpdates.firstOrNull()?.let { update ->
            Update(
              id = update.id,
              name = update.message ?: "No message",
              createdAt = update.createdAt as? String,
              isCompatible = true,
              permalink = update.manifestPermalink
            )
          }
        )
      }
    } else {
      apolloClientService.fetchBranches(
        appId = appId,
        offset = _state.value.branches.size,
        limit = limit
      ).data?.app?.byId?.updateBranches?.map { updateBranch ->
        Branch(
          name = updateBranch.name,
          compatibleUpdate = null
        )
      }
    } ?: emptyList()

    hasMore.value = branches.size == limit

    _state.value = _state.value.copy(
      isLoading = false,
      branches = _state.value.branches + branches
    )
  }

  fun onAction(action: BranchesAction) {
    when (action) {
      BranchesAction.LoadMoreBranches -> viewModelScope.launch { loadMoreBranches() }
      is BranchesAction.OpenBranch -> throw IllegalStateException("Opening branches should be handled in the screen, not in the ViewModel.")
    }
  }
}
