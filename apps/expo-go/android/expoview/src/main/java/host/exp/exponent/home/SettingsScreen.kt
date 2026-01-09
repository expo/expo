package host.exp.exponent.home

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.services.ThemeSetting
import kotlinx.coroutines.launch

private fun getMajorVersion(version: String): String {
  return version.split(".").firstOrNull() ?: version
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
  viewModel: HomeAppViewModel,
  bottomBar: @Composable () -> Unit = { },
  accountHeader: @Composable () -> Unit = { }
) {


  val selectedTheme by viewModel.selectedTheme.collectAsState()

  Scaffold(
    topBar = { SettingsTopBar(accountHeader = accountHeader) },
    bottomBar = bottomBar
  ) { paddingValues ->


    Column(
      modifier = Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState())
        .padding(paddingValues)
    ) {
      ThemeSection(
        selectedTheme = selectedTheme,
        onThemeSelected = { viewModel.selectedTheme.value = it }
      )

      AppInfoSection(
        clientVersion = viewModel.expoVersion ?: "unknown",
        supportedSdk = getMajorVersion(ExponentBuildConstants.TEMPORARY_SDK_VERSION)
      )

      Spacer(modifier = Modifier.height(16.dp))

      DeleteAccountSection()
    }
  }
}

@Composable
fun ThemeSection(
  selectedTheme: ThemeSetting,
  onThemeSelected: (ThemeSetting) -> Unit
) {
  LabeledGroup(label = "Theme") {
    ClickableItemRow(
      text = "Automatic",
//            icon = rememberVectorPainter(Icons.Default.BrightnessAuto),
      onClick = { onThemeSelected(ThemeSetting.Automatic) },
      action = {
        RadioButton(
          selected = selectedTheme == ThemeSetting.Automatic,
          onClick = null
        )
      }
    )
    HorizontalDivider()
    ClickableItemRow(
      text = "Light",
//            icon = rememberVectorPainter(Icons.Default.LightMode),
      onClick = { onThemeSelected(ThemeSetting.Light) },
      action = {
        RadioButton(
          selected = selectedTheme == ThemeSetting.Light,
          onClick = null
        )
      }
    )
    HorizontalDivider()
    ClickableItemRow(
      text = "Dark",
//            icon = rememberVectorPainter(Icons.Default.DarkMode),
      onClick = { onThemeSelected(ThemeSetting.Dark) },
      action = {
        RadioButton(
          selected = selectedTheme == ThemeSetting.Dark,
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
  val context = LocalContext.current

  fun copyToClipboard(label: String, text: String) {
    val clipboard =
      context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
    val clip = android.content.ClipData.newPlainText(label, text)
    clipboard.setPrimaryClip(clip)
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
  var isDeleting by remember { mutableStateOf(false) }
  var deletionError by remember { mutableStateOf<String?>(null) }
  val context = LocalContext.current
  val coroutineScope = rememberCoroutineScope()

  fun handleDeleteAccount() {
    if (isDeleting) return
    isDeleting = true
    deletionError = null

    coroutineScope.launch {
      try {
        val redirectBase = "expauth://after-delete"
        val encodedRedirect = Uri.encode(redirectBase)
        val authSessionURL =
          "https://expo.dev/settings/delete-user-expo-go?post_delete_redirect_uri=$encodedRedirect"

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(authSessionURL)).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
        // Unlike WebBrowser.openAuthSessionAsync, we can't directly await a result here.
        // The deep link `expauth://after-delete` would need to be handled by an
        // Activity with a corresponding intent filter to complete the sign-out flow.
      } catch (e: Exception) {
        deletionError = e.message ?: "An unknown error occurred"
      } finally {
        isDeleting = false
      }
    }
  }

  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp),
    shape = RoundedCornerShape(8.dp),
    colors = CardDefaults.cardColors(
      containerColor = MaterialTheme.colorScheme.surface
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
          style = MaterialTheme.typography.bodySmall,
        )
      }

      Spacer(modifier = Modifier.height(8.dp))

      Text(
        text = "This action is irreversible. It will delete your personal account, projects, and activity.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.secondary
      )

      deletionError?.let {
        Spacer(modifier = Modifier.height(8.dp))
        Text(
          text = it,
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.error
        )
      }

      Spacer(modifier = Modifier.height(16.dp))

      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.End
      ) {
        Button(
          onClick = { handleDeleteAccount() },
          enabled = !isDeleting,
          colors = ButtonDefaults.buttonColors(
            containerColor = Color.Red,
            contentColor = Color.White
          ),
          shape = RoundedCornerShape(4.dp)
        ) {
          if (isDeleting) {
            CircularProgressIndicator(
              modifier = Modifier.size(24.dp),
              color = Color.White,
              strokeWidth = 2.dp
            )
          } else {
            Text("Delete Account")
          }
        }
      }
    }
  }
}
