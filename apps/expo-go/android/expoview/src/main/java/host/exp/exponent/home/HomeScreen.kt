package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import host.exp.expoview.R


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
  viewModel: HomeAppViewModel,
  navigateToProjects: () -> Unit,
  navigateToSnacks: () -> Unit,
  navigateToProjectDetails: (appId: String) -> Unit,
  accountHeader: @Composable () -> Unit = { },
  bottomBar: @Composable () -> Unit = { }
) {
  val sessions by viewModel.sessions.collectAsState()
  val recents by viewModel.recents.collectAsState()
  val snacks by viewModel.snacks.dataFlow.collectAsState()

  val account by viewModel.account.dataFlow.collectAsState()
  val isRefreshing by viewModel.account.loadingFlow.collectAsState()
  val apps by viewModel.apps.dataFlow.collectAsState()

  val state = rememberPullToRefreshState()
  val onRefresh = {
    viewModel.account.refresh()
    viewModel.apps.refresh()
  }

  Scaffold(
    topBar = {
      // Reusable Header composable for the top bar
      TopAppBar(
        title = {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
              painter = painterResource(id = R.drawable.big_logo_new_filled),
              contentDescription = "Expo Go logo",
              modifier = Modifier.size(48.dp, 48.dp)
            )
            Text("Expo Go", fontWeight = FontWeight.Bold)
          }
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = NewAppTheme.colors.background.default),
        actions = {
          accountHeader()
        }
      )
    },
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
        LabeledGroup(
          label = "Development servers",
          action = {
            SmallActionButton(label = "HELP", onClick = { TODO() })
          }
        ) {
          for (session in sessions) {
            DevSessionRow(session = session)
            HorizontalDivider()
          }

          if (sessions.isEmpty()) {
            LocalServerTutorial(
              isSignedIn = account != null,
              modifier = Modifier.padding(16.dp, 8.dp)
            )
            HorizontalDivider()
          }

          EnterUrlRow()
          HorizontalDivider()
          ClickableItemRow(
            text = "Scan QR",
            icon = {
              Image(
                painter = painterResource(id = R.drawable.qr_code),
                contentDescription = "QR Code Icon",
                modifier = Modifier.size(24.dp)
              )
            },
            onClick = { TODO() }
          )
        }

        if (!recents.isEmpty()) {
          LabeledGroup(
            label = "Recent history",
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
