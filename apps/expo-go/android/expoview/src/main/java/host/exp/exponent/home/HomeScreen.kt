package host.exp.exponent.home

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import host.exp.expoview.R


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
  viewModel: HomeAppViewModel,
  navigateToProjects: () -> Unit,
  navigateToSnacks: () -> Unit,
  navigateToProjectDetails: (appId: String) -> Unit,
  onLoginClick: () -> Unit,
  accountHeader: @Composable () -> Unit = { },
  bottomBar: @Composable () -> Unit = { }
) {
  val recents by viewModel.recents.collectAsState()
  val snacks by viewModel.snacks.dataFlow.collectAsState()

  val account by viewModel.account.dataFlow.collectAsState()
  val isRefreshing by viewModel.account.loadingFlow.collectAsState()
  val apps by viewModel.apps.dataFlow.collectAsState()
  val developmentServers by viewModel.developmentServers.collectAsState()

  val context = LocalContext.current
  val uriHandler = LocalUriHandler.current

  val state = rememberPullToRefreshState()
  val onRefresh: () -> Unit = {
    viewModel.account.refresh()
    viewModel.apps.refresh()
  }

  Scaffold(
    topBar = { SettingsTopBar(accountHeader = accountHeader) },
    bottomBar = bottomBar
  ) {
    PullToRefreshBox(
      modifier = Modifier.padding(it),
      state = state,
      isRefreshing = isRefreshing,
      onRefresh = onRefresh,
    ) {

      Column(
        modifier = Modifier
          .fillMaxSize()
          .verticalScroll(rememberScrollState())
      ) {
        UpgradeWarning()
//    TODO: java.lang.NullPointerException: Attempt to invoke virtual method 'java.lang.String host.exp.exponent.home.DevSessionSource.name()' on a null object reference
        LabeledGroup(
          label = "Development servers",
          modifier = Modifier.padding(top = 8.dp),
          image = painterResource(id = R.drawable.terminal_icon),
          action = { SmallActionButton(label = "HELP", onClick = { TODO() }) }) {
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
                onClick = { viewModel.clearRecents() })
            }) {
            for (historyItem in recents) {
              RecentRow(historyItem = historyItem)
              HorizontalDivider()
            }
          }
        }

        if (!apps.isEmpty()) {
          LabeledGroup(
            label = "Projects",
            modifier = Modifier.padding(top = 8.dp),
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
            modifier = Modifier.padding(top = 8.dp, bottom = 8.dp),
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