package host.exp.exponent.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import host.exp.exponent.graphql.ProjectsQuery
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow

@OptIn(
  ExperimentalMaterial3Api::class, ExperimentalCoroutinesApi::class,
  ExperimentalMaterial3ExpressiveApi::class
)
@Composable
fun ProjectDetailsScreen(
  viewModel: HomeAppViewModel,
  onGoBack: () -> Unit,
  onBranchClick: (branchName: String) -> Unit,
  onShowAllBranchesClick: () -> Unit,
  bottomBar: @Composable () -> Unit = { },
  appFlow: Flow<ProjectsQuery.ById?>
) {
  val app by appFlow.collectAsState(initial = null)
  // Should we use the same flow pattern as in ProjectsScreen? Only case is probably account deletion.
  val branches by viewModel.branches(app?.id, 5).collectAsState(null)

  // Filter the branches to only include those that have updates.
  val branchesToRender = branches?.filter { it.updates.isNotEmpty() }

  if (app == null) {
    // TODO: show a proper loading state
    Text("No app found")
    return
  }

  Scaffold(
    topBar = {
      TopAppBarWithBackIcon(app?.name ?: "Project", onGoBack = onGoBack)
    },
    bottomBar = bottomBar
  ) { padding ->
    // Use a simple Box for the layout, as pull-to-refresh is not needed
    Column(
      modifier = Modifier
        .padding(padding)
        .fillMaxSize(),
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .background(MaterialTheme.colorScheme.surface)
          .padding(16.dp)
      ) {
        Text(
          text = app?.name ?: "Unnamed Project",
          style = MaterialTheme.typography.bodyLargeEmphasized,
        )
        Spacer(modifier = Modifier.height(4.dp))

        Text(
          text = app?.name ?: "Unnamed Project",
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))

        Text(
          text = "Owned by ${app?.ownerAccount?.name}",
          style = MaterialTheme.typography.bodySmall
        )

      }
      HorizontalDivider()
      LabeledGroup(label = "Branches", modifier = Modifier.padding(top = 8.dp)) {
        if (branchesToRender?.isNotEmpty() == true) {
          TruncatedList(
            items = branchesToRender,
            maxItems = 3,
            onShowMoreClick = {
              onShowAllBranchesClick()
            },
            renderItem = { branch ->
              BranchRow(
                branch = branch,
                onClick = { onBranchClick(branch.name) }
              )
            }
          )
        } else {
          Text(
            text = "No branches found",
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(16.dp)
          )
        }
      }
    }
  }
}
