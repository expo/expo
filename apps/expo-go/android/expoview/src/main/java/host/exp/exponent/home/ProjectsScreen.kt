package host.exp.exponent.home

import androidx.compose.foundation.layout.*

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlin.collections.emptyList


@OptIn(ExperimentalMaterial3Api::class, ExperimentalCoroutinesApi::class)
@Composable
fun ProjectsScreen(
    viewModel: HomeAppViewModel,
    onGoBack: () -> Unit,
    bottomBar: @Composable () -> Unit = { }
) {
    val loading by viewModel.appsPaginator.loadingFlow.collectAsState()

    val apps by viewModel.appsPaginator.dataFlow.flatMapLatest { paginator ->
        paginator?.data ?: flowOf(emptyList())
    }.collectAsState(initial = emptyList())

    val paginator by viewModel.appsPaginator.dataFlow.collectAsState()
    val canLoadMore = !(paginator?.isLastPage ?: true)
    val isFetching = paginator?.isFetching ?: false

    val pullToRefreshState = rememberPullToRefreshState()
    val lazyListState = rememberLazyListState()

    Scaffold(
        topBar = {
            TopAppBarWithBackIcon("Projects", onGoBack = onGoBack)
        },
        bottomBar = bottomBar
    ) {
        PullToRefreshBox(
            modifier = Modifier.padding(it),
            state = pullToRefreshState,
            isRefreshing = loading,
            onRefresh = {
                viewModel.appsPaginator.refresh()
            },
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                state = lazyListState
            ) {
                items(apps) { app ->
                    AppRow(app = app)
                    HorizontalDivider()
                }
                if (isFetching) {
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

            LaunchedEffect(lazyListState, canLoadMore, isFetching) {
                if (isFetching || !canLoadMore) {
                    return@LaunchedEffect
                }

                if(lazyListState.layoutInfo.visibleItemsInfo.isEmpty()) {
                    paginator?.loadMore()
                    return@LaunchedEffect
                }

                val lastVisibleItem = lazyListState.layoutInfo.visibleItemsInfo.last()

                val buffer = 3
                if (lastVisibleItem.index >= apps.size - 1 - buffer) {
                    paginator?.loadMore()
                }
            }
        }
    }
}
