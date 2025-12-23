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
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlin.collections.emptyList


@OptIn(ExperimentalMaterial3Api::class, ExperimentalCoroutinesApi::class)
@Composable
fun ProjectsScreen(
    viewModel: HomeAppViewModel,
    onGoBack: () -> Unit,
    navigateToProjectDetails: (appId: String) -> Unit,
    bottomBar: @Composable () -> Unit = { }
) {
    val isRefreshing by viewModel.appsPaginatorRefreshableFlow.loadingFlow.collectAsState()

    val apps by viewModel.appsPaginatorRefreshableFlow.dataFlow.flatMapLatest { paginator ->
        paginator?.data ?: flowOf(emptyList())
    }.collectAsState(initial = emptyList())

    val paginator by viewModel.appsPaginatorRefreshableFlow.dataFlow.collectAsState()
    val isFetching by viewModel.appsPaginatorRefreshableFlow.dataFlow.flatMapLatest { paginator ->
        paginator?.isFetching ?: flowOf(false)
    }.collectAsState(initial = false)

    val canLoadMore by viewModel.appsPaginatorRefreshableFlow.dataFlow.flatMapLatest { paginator ->
        paginator?.isLastPage?.map { it.not() } ?: flowOf(true)
    }.collectAsState(initial = true)

    val pullToRefreshState = rememberPullToRefreshState()
    val lazyListState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBarWithBackIcon("Projects", onGoBack = onGoBack)
        },
        bottomBar = bottomBar
    ) {
        PullToRefreshBox(
            modifier = Modifier.padding(it),
            state = pullToRefreshState,
//            TODO: find something better than checking apps.isNotEmpty()
            isRefreshing = isRefreshing && apps.isNotEmpty(),
            onRefresh = {
                viewModel.appsPaginatorRefreshableFlow.refresh()
            },
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                state = lazyListState
            ) {
                items(apps) { app ->
                    AppRow(app = app, onClick = { navigateToProjectDetails(app.commonAppData.id) })
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

            InfiniteListHandler(listState = lazyListState, isFetching = isFetching, canLoadMore = canLoadMore) {
                paginator?.loadMore()
            }
        }
    }
}
