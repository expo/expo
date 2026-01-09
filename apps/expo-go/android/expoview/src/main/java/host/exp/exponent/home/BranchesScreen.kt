package host.exp.exponent.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Scaffold
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map

@OptIn(ExperimentalMaterial3Api::class, ExperimentalCoroutinesApi::class)
@Composable
fun BranchesScreen(
  viewModel: HomeAppViewModel,
  appId: String,

  onGoBack: () -> Unit,

  navigateToBranchDetails: (appId: String, branchName: String) -> Unit,
  bottomBar: @Composable () -> Unit = {}
) {
  val paginatorRefreshableFlow = remember { viewModel.branchesPaginatorRefreshableFlow(appId) }

  val branches by paginatorRefreshableFlow.dataFlow.flatMapLatest { paginator ->
    paginator?.data ?: flowOf(emptyList())
  }.collectAsState(initial = emptyList())

  val branchesToRender = branches.filter { it.updates.isNotEmpty() }


  val isFetching by paginatorRefreshableFlow.dataFlow.flatMapLatest { paginator ->
    paginator?.isFetching ?: flowOf(false)
  }.collectAsState(initial = false)

  val canLoadMore by paginatorRefreshableFlow.dataFlow.flatMapLatest { paginator ->
    paginator?.isLastPage?.map { it.not() } ?: flowOf(true)
  }.collectAsState(initial = true)

  val paginator by paginatorRefreshableFlow.dataFlow.collectAsState()

  val pullToRefreshState = rememberPullToRefreshState()
  val lazyListState = rememberLazyListState()
  rememberCoroutineScope()

  Scaffold(
    topBar = {
      TopAppBarWithBackIcon(
        label = "Branches",
        onGoBack = onGoBack,
      )
    },
    bottomBar = bottomBar
  ) { padding ->
    PullToRefreshBox(
      modifier = Modifier.padding(padding),
      state = pullToRefreshState,
      isRefreshing = isFetching && branches.isNotEmpty(),
      onRefresh = { paginator }
    ) {
      if (isFetching && branches.isEmpty()) {
        Box(
          modifier = Modifier.fillMaxSize(),
          contentAlignment = Alignment.Center
        ) {
          CircularProgressIndicator()
        }
      } else {
        LazyColumn(
          modifier = Modifier.fillMaxSize(),
          state = lazyListState
        ) {
          items(branchesToRender, key = { it.id }) { branch ->
            BranchRow(
              branch = branch,
              onClick = {
                navigateToBranchDetails(appId, branch.name)
              }
            )
            HorizontalDivider()
          }

          if (canLoadMore) {
            item {
              Box(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(16.dp),
                contentAlignment = Alignment.Center
              ) {
                CircularProgressIndicator()
              }
            }
          }
        }
      }

      InfiniteListHandler(
        listState = lazyListState,
        isFetching = isFetching,
        canLoadMore = canLoadMore
      ) {
        paginator?.loadMore()
      }
    }
  }
}
