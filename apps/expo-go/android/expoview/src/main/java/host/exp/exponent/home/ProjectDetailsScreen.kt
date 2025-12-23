package host.exp.exponent.home

import androidx.compose.foundation.layout.*

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.geometry.isEmpty
import host.exp.exponent.graphql.Home_AccountAppsQuery
import host.exp.exponent.graphql.ProjectsQuery
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlin.collections.emptyList
import kotlin.collections.isNotEmpty


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

    // --- Start of Fix ---
    // Filter the branches to only include those that have updates.
    val branchesToRender = branches?.filter { it.updates.isNotEmpty() }
    // --- End of Fix ---

    if (app == null) {
//         todo: show a proper loading state
        return Text("No app found")
    }

    Scaffold(
        topBar = {
            // Use the app's name for the TopAppBar title
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
                // Big title of the project
                Text(
                    text = app?.name ?: "Unnamed Project",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))

                // Project slug
                Text(
                    text = "@${app?.ownerAccount?.name}/${app?.fullName}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))

                // Owned by author name
                Text(
                    text = "Owned by ${app?.ownerAccount?.name}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            if (branchesToRender?.isNotEmpty() == true) {
                // Pass the click handler to TruncatedList
                TruncatedList(
                    items = branchesToRender,
//                    TODO: Remove
                    maxItems = 0,
                    onShowMoreClick = {
                        onShowAllBranchesClick()
                    },
                    renderItem = { branch ->
                        // Pass the click handler to BranchRow
                        BranchRow(
                            branch = branch,
                            onClick = { onBranchClick(branch.name) } // Handle click
                        )
                    }
                )
            }
        }
    }
}
