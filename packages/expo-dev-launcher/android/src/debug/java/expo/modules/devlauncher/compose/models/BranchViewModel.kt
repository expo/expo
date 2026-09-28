package expo.modules.devlauncher.compose.models

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.compose.Update
import expo.modules.devlauncher.compose.utils.formatUpdateUrl
import expo.modules.devlauncher.services.AppService
import expo.modules.devlauncher.services.ApplicationInfo
import expo.modules.devlauncher.services.GraphQLService
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted.Companion.WhileSubscribed
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface BranchAction {
  object LoadMoreUpdates : BranchAction
  class OpenUpdate(val update: Update) : BranchAction
}

data class BranchState(
  val updates: List<Update> = emptyList(),
  val isLoading: Boolean = false,
  val hasMore: Boolean = false,
  val loadingUpdateId: String? = null
)

class BranchViewModel(private val branchName: String) : ViewModel() {
  private val appService = inject<AppService>()
  private val graphQLService = inject<GraphQLService>()
  private val launcher = inject<DevLauncherController>()

  private var hasMore = true

  private var _state = MutableStateFlow(
    BranchState(
      updates = emptyList(),
      isLoading = true
    )
  )

  val state = _state.onStart {
    hasMore = true
    loadMoreUpdates()
  }.stateIn(
    scope = viewModelScope,
    started = WhileSubscribed(5_000),
    initialValue = _state.value
  )

  private suspend fun loadMoreUpdates() {
    if (!hasMore) {
      return
    }

    val updateConfiguration = appService.applicationInfo as? ApplicationInfo.Updates ?: return

    _state.value = _state.value.copy(isLoading = true)

    val appId = updateConfiguration.appId
    val runtimeVersion = updateConfiguration.runtimeVersion
    val limit = 20

    val updates = graphQLService.fetchUpdates(
      appId = appId,
      branchName = branchName,
      limit = limit,
      offset = _state.value.updates.size
    )

    val uiUpdates = updates.data?.updates?.map { update ->
      Update(
        id = update.id,
        name = update.message ?: "No message",
        createdAt = update.createdAt,
        isCompatible = update.runtimeVersion == runtimeVersion,
        permalink = update.manifestPermalink
      )
    } ?: emptyList()

    hasMore = uiUpdates.size == limit

    _state.value = _state.value.copy(
      updates = _state.value.updates + uiUpdates,
      isLoading = false,
      hasMore = hasMore
    )
  }

  fun onAction(action: BranchAction) {
    when (action) {
      BranchAction.LoadMoreUpdates -> {
        if (_state.value.isLoading) {
          return
        }
        viewModelScope.launch { loadMoreUpdates() }
      }
      is BranchAction.OpenUpdate -> {
        if (_state.value.loadingUpdateId != null) {
          return
        }
        _state.value = _state.value.copy(loadingUpdateId = action.update.id)
        launcher.coroutineScope.launch {
          try {
            launcher.loadApp(
              formatUpdateUrl(action.update.permalink, action.update.name)
            )
          } finally {
            _state.value = _state.value.copy(loadingUpdateId = null)
          }
        }
      }
    }
  }
}
