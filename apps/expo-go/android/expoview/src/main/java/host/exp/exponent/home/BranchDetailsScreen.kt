// In BranchDetailsScreen.kt (or create the file if it doesn't exist)
package host.exp.exponent.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import host.exp.exponent.graphql.BranchDetailsQuery

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BranchDetailsScreen(
    onGoBack: () -> Unit,
    branchRefreshableFlow: RefreshableFlow<BranchDetailsQuery.ById?>,
    bottomBar: @Composable () -> Unit = { }
) {
    // 1. Collect state from the RefreshableFlow
    val isRefreshing by branchRefreshableFlow.loadingFlow.collectAsState()
    val branch by branchRefreshableFlow.dataFlow.collectAsState()
    val onRefresh = { branchRefreshableFlow.refresh() }

    val pullToRefreshState = rememberPullToRefreshState()
    val updates = branch?.updateBranchByName?.updates ?: emptyList()

    Scaffold(
        topBar = {
            TopAppBarWithBackIcon(branch?.name ?: "Branch", onGoBack = onGoBack)
        },
        bottomBar = bottomBar
    ) { padding ->
        PullToRefreshBox(
            modifier = Modifier.padding(padding),
            state = pullToRefreshState,
            isRefreshing = isRefreshing,
            onRefresh = onRefresh
        ) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Text(
                            text = "Updates for branch: ${branch?.name}",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        HorizontalDivider(modifier = Modifier.padding(top = 16.dp))
                    }

                    items(updates, key = { it.id }) { update ->
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = update.updateData.message ?: "No message",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "ID: ${update.id}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            HorizontalDivider(modifier = Modifier.padding(top = 16.dp))
                        }
                    }
                }
            }
        }
    }
