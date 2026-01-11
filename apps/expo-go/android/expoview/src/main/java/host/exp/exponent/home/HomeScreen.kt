package host.exp.exponent.home

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import host.exp.expoview.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
  viewModel: HomeAppViewModel,
  navigateToProjects: () -> Unit,
  navigateToSnacks: () -> Unit,
  navigateToProjectDetails: (appId: String) -> Unit,
  navigateToFeedback: () -> Unit,
  onLoginClick: () -> Unit,
  accountHeader: @Composable () -> Unit = { },
  bottomBar: @Composable () -> Unit = { }
) {
  val recents by viewModel.recents.collectAsStateWithLifecycle()
  val snacks by viewModel.snacks.dataFlow.collectAsStateWithLifecycle()

  val account by viewModel.account.dataFlow.collectAsStateWithLifecycle()
  val isRefreshing by viewModel.account.loadingFlow.collectAsStateWithLifecycle()
  val apps by viewModel.apps.dataFlow.collectAsStateWithLifecycle()
  val developmentServers by viewModel.developmentServers.collectAsStateWithLifecycle()

  val context = LocalContext.current
  val uriHandler = LocalUriHandler.current

  val state = rememberPullToRefreshState()
  val onRefresh: () -> Unit = {
    viewModel.account.refresh()
    viewModel.apps.refresh()
  }

  var showHelpDialog by remember { mutableStateOf(false) }

  if (showHelpDialog) {
    AlertDialog(
      onDismissRequest = { showHelpDialog = false },
      title = { Text("Troubleshooting") },
      text = {
        Text(
          stringResource(R.string.help_dialog)
        )
      },
      confirmButton = {
        TextButton(onClick = { showHelpDialog = false }) {
          Text("OK")
        }
      }
    )
  }

  Scaffold(
    topBar = { SettingsTopBar(accountHeader = accountHeader) },
    bottomBar = bottomBar
  ) {
    PullToRefreshBox(
      modifier = Modifier.padding(it),
      state = state,
      isRefreshing = isRefreshing,
      onRefresh = onRefresh
    ) {
      Column(
        modifier = Modifier
          .fillMaxSize()
          .verticalScroll(rememberScrollState())
      ) {
        UpgradeWarning()
        UserReviewSection(
          viewModel = viewModel,
          navigateToFeedback = { navigateToFeedback() }
        )
        LabeledGroup(
          label = "Development servers",
          modifier = Modifier.padding(top = 8.dp),
          image = painterResource(id = R.drawable.terminal_icon),
          action = { SmallActionButton(label = "HELP", onClick = { showHelpDialog = true }) }
        ) {
          for (session in developmentServers) {
            DevSessionRow(session = session)
            HorizontalDivider()
          }
          if (developmentServers.isEmpty()) {
            LocalServerTutorial(
              isSignedIn = account != null,
              modifier = Modifier.padding(16.dp, 16.dp),
              onLoginClick = onLoginClick
            )
            HorizontalDivider()
          }
          EnterUrlRow()
          HorizontalDivider()
          ClickableItemRow(
            text = "Scan QR",
            icon = {
              Icon(
                painter = painterResource(id = R.drawable.qr_code),
                contentDescription = "Scan QR Code",
                modifier = Modifier.size(24.dp)
              )
            },
            onClick = {
              viewModel.scanQR(
                context,
                onSuccess = { url ->
                  uriHandler.openUri(url)
                },
                onError = { error ->
                  Toast.makeText(context, error, Toast.LENGTH_LONG).show()
                }
              )
            }
          )
        }

        if (!recents.isEmpty()) {
          LabeledGroup(
            label = "Recent history",
            modifier = Modifier.padding(top = 8.dp),
            action = {
              SmallActionButton(
                label = "CLEAR",
                onClick = { viewModel.clearRecents() }
              )
            }
          ) {
            for (historyItem in recents) {
              RecentRow(historyItem = historyItem)
              HorizontalDivider()
            }
          }
        }

        if (!apps.isEmpty()) {
          LabeledGroup(
            label = "Projects",
            modifier = Modifier.padding(top = 8.dp)
          ) {
            TruncatedList(
              apps,
              showMoreText = "View all projects",
              onShowMoreClick = navigateToProjects
            ) { app ->
              AppRow(app, onClick = { navigateToProjectDetails(app.commonAppData.id) })
            }
          }
        }

        if (!snacks.isEmpty()) {
          LabeledGroup(
            label = "Snacks",
            modifier = Modifier.padding(top = 8.dp, bottom = 8.dp)
          ) {
            TruncatedList(
              snacks,
              showMoreText = "View all snacks",
              onShowMoreClick = navigateToSnacks
            ) { snack ->
              SnackRow(snack)
            }
          }
        }
      }
    }
  }
}
