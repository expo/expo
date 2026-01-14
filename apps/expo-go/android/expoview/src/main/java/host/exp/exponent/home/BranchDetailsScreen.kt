// In BranchDetailsScreen.kt (or create the file if it doesn't exist)
package host.exp.exponent.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import host.exp.exponent.graphql.BranchDetailsQuery

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BranchDetailsScreen(
  onGoBack: () -> Unit,
  branchRefreshableFlow: RefreshableFlow<BranchDetailsQuery.ById?>,
  bottomBar: @Composable () -> Unit = { }
) {
  val isRefreshing by branchRefreshableFlow.loadingFlow.collectAsStateWithLifecycle()
  val branch by branchRefreshableFlow.dataFlow.collectAsStateWithLifecycle()
  val onRefresh = { branchRefreshableFlow.refresh() }

  val pullToRefreshState = rememberPullToRefreshState()
  val updates = branch?.updateBranchByName?.updates ?: emptyList()

  Scaffold(
    topBar = {
      TopAppBarWithBackIcon(
        "Branch",
        onGoBack = onGoBack
      )
    },
    bottomBar = bottomBar
  ) { padding ->
    PullToRefreshBox(
      modifier = Modifier.padding(padding),
      state = pullToRefreshState,
      isRefreshing = isRefreshing,
      onRefresh = onRefresh
    ) {
      Column(modifier = Modifier.fillMaxSize()) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(16.dp)
        ) {
          Text(
            text = branch?.updateBranchByName?.name ?: "Unnamed Branch",
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium
          )
          Spacer(modifier = Modifier.height(4.dp))
        }
        HorizontalDivider()
        LabeledGroup(label = "Updates", modifier = Modifier.padding(top = 8.dp)) {
          //  TODO: Migrate to a LazyColumn if the list of updates can be long
          updates.forEachIndexed { index, update ->
            UpdateRow(update = update)
            if (index < updates.lastIndex) {
              HorizontalDivider()
            }
          }
        }
      }
    }
  }
}
