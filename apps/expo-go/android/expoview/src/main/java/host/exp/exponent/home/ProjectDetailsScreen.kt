package host.exp.exponent.home

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LoadingIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import host.exp.exponent.graphql.ProjectsQuery
import host.exp.exponent.services.RESTApiClient
import host.exp.expoview.R
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow

@OptIn(
  ExperimentalMaterial3Api::class,
  ExperimentalCoroutinesApi::class,
  ExperimentalMaterial3ExpressiveApi::class
)

private fun shareProjectUrl(context: Context, fullName: String, projectName: String?) {
  // Construct the URL in the format: exp://expo.dev/@user/project-slug
  val projectUrl = "exp://${RESTApiClient.HOST}/$fullName"
  val intent = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"
    putExtra(Intent.EXTRA_SUBJECT, projectName ?: "Check out this Expo project")
    putExtra(Intent.EXTRA_TEXT, projectUrl)
  }
  context.startActivity(Intent.createChooser(intent, "Share Project"))
}


@Composable
fun ProjectDetailsScreen(
  viewModel: HomeAppViewModel,
  onGoBack: () -> Unit,
  onBranchClick: (branchName: String) -> Unit,
  onShowAllBranchesClick: () -> Unit,
  bottomBar: @Composable () -> Unit = { },
  appFlow: Flow<ProjectsQuery.ById?>
) {
  val app by appFlow.collectAsStateWithLifecycle(initialValue = null)
  // Should we use the same flow pattern as in ProjectsScreen? Only case is probably account deletion.
  val branches by viewModel
    .branches(app?.id, 5)
    .collectAsStateWithLifecycle(initialValue = null)

  val context = LocalContext.current

  // Filter the branches to only include those that have updates.
  val branchesToRender = branches?.filter { it.updates.isNotEmpty() }


  Scaffold(
    topBar = {
      TopAppBarWithBackIcon(
        app?.name ?: "Project",
        onGoBack = onGoBack,
        actions = {
          IconButton(onClick = {
            val app = app
            if(app != null) {
              shareProjectUrl(context, app.fullName, app.name)
            }
          }) {
            Icon(
              painter = painterResource(id = R.drawable.share),
              contentDescription = "Share Project"
            )
          }
        }
      )
    },
    bottomBar = bottomBar
  ) { padding ->

    if(app == null) {
      return@Scaffold  Box(
        modifier = Modifier
          .fillMaxWidth()
          .padding(16.dp),
        contentAlignment = Alignment.Center
      ) {
        CircularProgressIndicator()
      }
    }

    // Use a simple Box for the layout, as pull-to-refresh is not needed
    Column(
      modifier = Modifier
        .padding(padding)
        .fillMaxSize()
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .background(MaterialTheme.colorScheme.surface)
          .padding(16.dp)
      ) {
        Text(
          text = app?.name ?: "Unnamed Project",
          style = MaterialTheme.typography.bodyLarge
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
      LabeledGroup(
        label = "Branches",
        modifier = Modifier.padding(top = 8.dp)
      ) {
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
