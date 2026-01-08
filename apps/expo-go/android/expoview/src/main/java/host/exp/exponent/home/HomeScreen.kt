package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import host.exp.expoview.R
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch


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



    val state = rememberPullToRefreshState()
    val onRefresh: () -> Unit = {
        viewModel.account.refresh()
        viewModel.apps.refresh()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.big_logo_new_filled),
                            contentDescription = "Expo Go logo",
                            modifier = Modifier.size(48.dp, 48.dp)
                        )
                        Text("Expo", fontWeight = FontWeight.Bold)
                    }},
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
                .fillMaxSize().verticalScroll(rememberScrollState())
        ) {
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
                    LocalServerTutorial(isSignedIn = account != null, modifier = Modifier.padding(16.dp, 16.dp), onLoginClick = onLoginClick)
                    HorizontalDivider()
                }
                EnterUrlRow()
                HorizontalDivider()
                ClickableItemRow(
                    text = "Scan QR",
                    icon = { Icon(painter = painterResource(id = R.drawable.qr_code), contentDescription = "Scan QR Code", modifier = Modifier.size(24.dp)) },
                    onClick = { TODO() })
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
                    TruncatedList(apps, showMoreText = "View all projects", onShowMoreClick = navigateToProjects)  { app ->
                        AppRow(app, onClick = { navigateToProjectDetails(app.commonAppData.id) })
                    }
                }
            }

            if (!snacks.isEmpty()) {
                LabeledGroup(
                    label = "Snacks",
                    modifier = Modifier.padding(top = 8.dp, bottom = 8.dp),
                    ) {
                    TruncatedList(snacks, showMoreText = "View all snacks", onShowMoreClick = navigateToSnacks)  { snack ->
                        SnackRow(snack)
                    }
                }
            }
        }
        }
    }
}