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
fun SnacksScreen(
    viewModel: HomeViewModel,
    onGoBack: () -> Unit,
    bottomBar: @Composable () -> Unit = { }

) {
    val apps by viewModel.apps.collectAsState()

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
            TopAppBarWithBackIcon("Snacks", onGoBack = onGoBack)
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


            if (!apps.isEmpty()) {
                LabeledGroup() {
                    for (app in apps) {
                        DevSessionRow(session = app)
                        HorizontalDivider()
                    }
                }
            }
        }
        }
    }
}