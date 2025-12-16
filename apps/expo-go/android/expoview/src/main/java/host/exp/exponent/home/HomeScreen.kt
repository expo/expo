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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    navigateToProjects: () -> Unit,
    navigateToSnacks: () -> Unit,
    bottomBar: @Composable () -> Unit = { }
) {
    val sessions by viewModel.sessions.collectAsState()
    val recents by viewModel.recents.collectAsState()
    val apps by viewModel.apps.collectAsState()
    val snacks by viewModel.snacks.collectAsState()

    val account by viewModel.account.collectAsState()
    val state = rememberPullToRefreshState()
    var isRefreshing by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val onRefresh: () -> Unit = {
        isRefreshing = true
        coroutineScope.launch {
            delay(5000)
            isRefreshing = false
        }
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
                    }},
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NewAppTheme.colors.background.default),
                actions = {
                    AccountHeaderAction(account = account, onLoginClick = { viewModel.login("sample username") }, onAccountClick = { viewModel.logout()})
                    Spacer(modifier = Modifier.width(16.dp))
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
                    TruncatedList(apps, showMoreText = "View all projects", onShowMoreClick = navigateToSnacks)  { app ->
                        SnackRow(app)
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