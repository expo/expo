package host.exp.exponent.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

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

    val isFetching by paginatorRefreshableFlow.dataFlow.flatMapLatest { paginator ->
        paginator?.isFetching ?: flowOf(false)
    }.collectAsState(initial = false)

    val canLoadMore by paginatorRefreshableFlow.dataFlow.flatMapLatest { paginator ->
        paginator?.isLastPage?.map { it.not() } ?: flowOf(true)
    }.collectAsState(initial = true)

    val paginator by paginatorRefreshableFlow.dataFlow.collectAsState()

    val pullToRefreshState = rememberPullToRefreshState()
    val lazyListState = rememberLazyListState()
    val scope = rememberCoroutineScope()

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
            // Initial loading indicator
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
                    items(branches, key = { it.id }) { branch ->
                        // Make the BranchRow clickable
                        BranchRow(
                            branch = branch,
                            onClick = {
                                // Use the branch's app ID and name for navigation
                                navigateToBranchDetails(appId, branch.name)
                            }
                        )
                        HorizontalDivider()
                    }

                    // Loading indicator for pagination
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

            InfiniteListHandler(listState = lazyListState, isFetching = isFetching, canLoadMore = canLoadMore) {
                    paginator?.loadMore()
            }
        }
    }
}