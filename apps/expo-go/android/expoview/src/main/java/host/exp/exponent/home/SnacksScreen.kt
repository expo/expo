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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map

@OptIn(ExperimentalMaterial3Api::class, ExperimentalCoroutinesApi::class)
@Composable
fun SnacksScreen(
  viewModel: HomeAppViewModel,
  onGoBack: () -> Unit,
  bottomBar: @Composable () -> Unit = {}
) {
  val paginator by viewModel
    .snacksPaginatorRefreshableFlow
    .dataFlow
    .collectAsStateWithLifecycle()

  val snacks = paginator
    ?.data
    ?.collectAsStateWithLifecycle(
      initialValue = emptyList()
    )
    ?.value
    ?: emptyList()
  val isFetching by viewModel
    .snacksPaginatorRefreshableFlow
    .dataFlow
    .flatMapLatest { paginator ->
      paginator?.isFetching ?: flowOf(false)
    }
    .collectAsStateWithLifecycle(initialValue = false)

  val canLoadMore by viewModel
    .snacksPaginatorRefreshableFlow
    .dataFlow
    .flatMapLatest { paginator ->
      paginator?.isLastPage?.map { it.not() } ?: flowOf(true)
    }
    .collectAsStateWithLifecycle(initialValue = true)

  val pullToRefreshState = rememberPullToRefreshState()
  val lazyListState = rememberLazyListState()
  rememberCoroutineScope()

  Scaffold(
    topBar = {
      TopAppBarWithBackIcon(
        label = "Snacks",
        onGoBack = onGoBack
      )
    },
    bottomBar = bottomBar
  ) { padding ->
    PullToRefreshBox(
      modifier = Modifier.padding(padding),
      state = pullToRefreshState,
      isRefreshing = isFetching && snacks.isNotEmpty(),
      onRefresh = { viewModel.snacksPaginatorRefreshableFlow.refresh() }
    ) {
      if (isFetching && snacks.isEmpty()) {
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
          items(snacks, key = { it.commonSnackData.id }) { snack ->
            SnackRow(snack = snack)
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
        canLoadMore = canLoadMore,
        onLoadMore = { paginator?.loadMore() }
      )
    }
  }
}
