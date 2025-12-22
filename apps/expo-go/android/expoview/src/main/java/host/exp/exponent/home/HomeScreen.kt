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
    accountHeader: @Composable () -> Unit = { },
    bottomBar: @Composable () -> Unit = { }
) {
    val sessions by viewModel.sessions.collectAsState()
    val recents by viewModel.recents.collectAsState()
    val snacks by viewModel.snacks.collectAsState()

    val account by viewModel.account.dataFlow.collectAsState()
    val isRefreshing by viewModel.account.loadingFlow.collectAsState()
    val apps by viewModel.apps.dataFlow.collectAsState()


    val state = rememberPullToRefreshState()
    val onRefresh: () -> Unit = {
        viewModel.account.refresh()
        viewModel.apps.refresh()
    }
    val context = LocalContext.current

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
                    }},
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
                .fillMaxSize().verticalScroll(rememberScrollState())
        ) {
            LabeledGroup(
                label = "Development servers",
                action = { SmallActionButton(label = "HELP", onClick = { TODO() }) }) {
                for (session in sessions) {
                    DevSessionRow(session = session)
                    HorizontalDivider()
                }
                if (sessions.isEmpty()) {
                    LocalServerTutorial(isSignedIn = account != null, modifier = Modifier.padding(16.dp, 8.dp))
                    HorizontalDivider()
                }
                EnterUrlRow()
                HorizontalDivider()
                ClickableItemRow(
                    text = "Scan QR",
                    icon = painterResource(id = R.drawable.qr_code),
                    onClick = { })
            }

            if (!recents.isEmpty()) {
                LabeledGroup(
                    label = "Recent history",
                    action = {
                        SmallActionButton(
                            label = "CLEAR",
                            onClick = { viewModel.clearRecents() })
                    }) {
                    for (session in recents) {
                        DevSessionRow(session = session)
                        HorizontalDivider()
                    }
                }
            }

            if (!apps.isEmpty()) {
                LabeledGroup(
                    label = "Projects",
                ) {
                    TruncatedList(apps, showMoreText = "View all projects", onShowMoreClick = navigateToProjects)  { app ->
                        AppRow(app)
                    }
                }
            }

            if (!snacks.isEmpty()) {
                LabeledGroup(
                    label = "Snacks",
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