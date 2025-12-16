package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: HomeViewModel,
    bottomBar: @Composable () -> Unit = { }
) {


    val account by viewModel.account.collectAsState()
    var selectedTheme by remember { mutableStateOf(AppTheme.AUTOMATIC) }

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
                        Text("Expo Go", fontWeight = FontWeight.Bold)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NewAppTheme.colors.background.default),
                actions = {
                    AccountHeaderAction(
                        account = account,
                        onLoginClick = { viewModel.login("sample username") },
                        onAccountClick = { viewModel.logout() })
                }
            )
        },
        bottomBar = bottomBar
    ) { paddingValues ->


        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()).padding(paddingValues)
        ) {
            ThemeSection(
                selectedTheme = selectedTheme,
                onThemeSelected = { selectedTheme = it }
            )


            AppInfoSection(
                clientVersion = "54.0.6",
                supportedSdk = "54"
            )

            Spacer(modifier = Modifier.height(16.dp))

            DeleteAccountSection()
        }
    }
}

// Define the available theme options
enum class AppTheme {
    AUTOMATIC,
    LIGHT,
    DARK
}


@Composable
fun ThemeSection(
    selectedTheme: AppTheme,
    onThemeSelected: (AppTheme) -> Unit
) {
    LabeledGroup(label = "Theme") {
        ClickableItemRow(
            text = "Automatic",
//            icon = rememberVectorPainter(Icons.Default.BrightnessAuto),
            onClick = { onThemeSelected(AppTheme.AUTOMATIC) },
            action = {
                RadioButton(
                    selected = selectedTheme == AppTheme.AUTOMATIC,
                    onClick = null // Null because the row click handles it
                )
            }
        )
        HorizontalDivider()
        ClickableItemRow(
            text = "Light",
//            icon = rememberVectorPainter(Icons.Default.LightMode),
            onClick = { onThemeSelected(AppTheme.LIGHT) },
            action = {
                RadioButton(
                    selected = selectedTheme == AppTheme.LIGHT,
                    onClick = null
                )
            }
        )
        HorizontalDivider()
        ClickableItemRow(
            text = "Dark",
//            icon = rememberVectorPainter(Icons.Default.DarkMode),
            onClick = { onThemeSelected(AppTheme.DARK) },
            action = {
                RadioButton(
                    selected = selectedTheme == AppTheme.DARK,
                    onClick = null
                )
            }
        )
    }
}


@Composable
fun AppInfoSection(
    clientVersion: String,
    supportedSdk: String
) {
    val context = androidx.compose.ui.platform.LocalContext.current

    fun copyToClipboard(label: String, text: String) {
        val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
        val clip = android.content.ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)
        // Optional: Show a toast to confirm copy
        // android.widget.Toast.makeText(context, "Copied $label", android.widget.Toast.LENGTH_SHORT).show()
    }

    LabeledGroup(label = "App Info") {
        ClickableItemRow(
            text = "Client version",
            onClick = { copyToClipboard("Client version", clientVersion) },
            action = {
                Text(
                    text = clientVersion,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        )
        HorizontalDivider()
        ClickableItemRow(
            text = "Supported SDKs",
            onClick = { copyToClipboard("Supported SDKs", supportedSdk) },
            action = {
                Text(
                    text = supportedSdk,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        )
    }
}


@Composable
fun DeleteAccountSection() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = NewAppTheme.colors.background.default
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
//                Icon(
//                    imageVector =
//                    contentDescription = "Delete Account",
//                    tint = Color.Red,
//                    modifier = Modifier.size(24.dp).padding(end = 8.dp)
//                )
                Text(
                    text = "Delete your account",
                    style = NewAppTheme.font.md,
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "This action is irreversible. It will delete your personal account, projects, and activity.",
                style = NewAppTheme.font.sm,
                color = NewAppTheme.colors.text.secondary
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Right-aligned button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Button(
                    onClick = { /* Handle delete action */ },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Red,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text("Delete Account")
                }
            }
        }
    }
}
