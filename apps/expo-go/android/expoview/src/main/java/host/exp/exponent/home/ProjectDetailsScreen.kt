package host.exp.exponent.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import host.exp.exponent.graphql.ProjectsQuery
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow

@OptIn(ExperimentalMaterial3Api::class, ExperimentalCoroutinesApi::class)
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
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      Column(modifier = Modifier.fillMaxWidth()) {
        Text(
          text = app?.name ?: "Unnamed Project",
          style = MaterialTheme.typography.headlineLarge,
          fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))

        Text(
          text = "@${app?.ownerAccount?.name}/${app?.fullName}",
          style = MaterialTheme.typography.bodyLarge,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))

        Text(
          text = "Owned by ${app?.ownerAccount?.name}",
          style = MaterialTheme.typography.bodyMedium
        )
      }

      if (branchesToRender?.isNotEmpty() == true) {
        TruncatedList(
          items = branchesToRender,
//                    TODO: Remove
          maxItems = 0,
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
      }
    }
  }
}
