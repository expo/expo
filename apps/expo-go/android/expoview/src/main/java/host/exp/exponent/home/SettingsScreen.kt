package host.exp.exponent.home

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import expo.modules.devmenu.DevMenuPreferences
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.services.ThemeSetting
import host.exp.expoview.R
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
  val selectedTheme by viewModel.selectedTheme.collectAsStateWithLifecycle()

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

      DeveloperMenuSection(viewModel.devMenuPreferencesAdapter)

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
      icon = {
        Icon(
          painter = painterResource(R.drawable.theme_auto),
          contentDescription = "Automatic Theme Icon",
          tint = MaterialTheme.colorScheme.onSurfaceVariant,
          modifier = Modifier.size(20.dp)
        )
      },
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
      icon = {
        Icon(
          painter = painterResource(R.drawable.theme_light),
          contentDescription = "Light Theme Icon",
          tint = MaterialTheme.colorScheme.onSurfaceVariant,
          modifier = Modifier.size(20.dp)
        )
      },
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
      icon = {
        Icon(
          painter = painterResource(R.drawable.theme_dark),
          contentDescription = "Dark Theme Icon",
          tint = MaterialTheme.colorScheme.onSurfaceVariant,
          modifier = Modifier.size(20.dp)
        )
      },
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
fun DeveloperMenuSection(
  devMenuPreference: DevMenuPreferences
) {
  var launchAtStart by remember { mutableStateOf(devMenuPreference.showsAtLaunch) }
  var enableShake by remember { mutableStateOf(devMenuPreference.motionGestureEnabled) }
  var enableThreeFingerLongPress by remember { mutableStateOf(devMenuPreference.touchGestureEnabled) }
  var showFab by remember { mutableStateOf(devMenuPreference.showFab) }

  DisposableEffect(true) {
    val onNewPreferences = {
      launchAtStart = devMenuPreference.showsAtLaunch
      enableShake = devMenuPreference.motionGestureEnabled
      enableThreeFingerLongPress = devMenuPreference.touchGestureEnabled
      showFab = devMenuPreference.showFab
    }

    devMenuPreference.addOnChangeListener(onNewPreferences)
    onDispose {
      devMenuPreference.removeOnChangeListener(onNewPreferences)
    }
  }

  @Composable
  fun Switch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
  ) {
    Switch(
      checked = checked,
      onCheckedChange = onCheckedChange,
      colors = SwitchDefaults.colors(
        checkedThumbColor = MaterialTheme.colorScheme.primary,
        checkedTrackColor = MaterialTheme.colorScheme.primaryContainer,
        uncheckedThumbColor = MaterialTheme.colorScheme.outline,
        uncheckedTrackColor = MaterialTheme.colorScheme.surfaceVariant,
        checkedBorderColor = Color.Transparent,
        uncheckedBorderColor = Color.Transparent
      )
    )
  }

  @Composable
  fun SwitchRow(
    text: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    iconPainter: Painter
  ) {
    ClickableItemRow(
      text = text,
      paddingVertical = 6.dp,
      icon = {
        Icon(
          painter = iconPainter,
          contentDescription = "$text icon",
          tint = MaterialTheme.colorScheme.onSurfaceVariant,
          modifier = Modifier.size(20.dp)
        )
      },
      onClick = { onCheckedChange(!checked) },
      action = {
        Switch(
          checked = checked,
          onCheckedChange = onCheckedChange
        )
      }
    )
  }

  LabeledGroup(label = "Developer Menu") {
    SwitchRow(
      text = "Show at launch",
      checked = launchAtStart,
      onCheckedChange = { newValue ->
        launchAtStart = newValue
        devMenuPreference.showsAtLaunch = newValue
      },
      iconPainter = painterResource(R.drawable.launch_at_start)
    )

    HorizontalDivider()

    SwitchRow(
      text = "Shake device",
      checked = enableShake,
      onCheckedChange = { newValue ->
        enableShake = newValue
        devMenuPreference.motionGestureEnabled = newValue
      },
      iconPainter = painterResource(R.drawable.shake)
    )

    HorizontalDivider()

    SwitchRow(
      text = "3 fingers long press",
      checked = enableThreeFingerLongPress,
      onCheckedChange = { newValue ->
        enableThreeFingerLongPress = newValue
        devMenuPreference.touchGestureEnabled = newValue
      },
      iconPainter = painterResource(R.drawable.three_finger_long_press)
    )

    HorizontalDivider()

    SwitchRow(
      text = "Action button",
      checked = showFab,
      onCheckedChange = { newValue ->
        showFab = newValue
        devMenuPreference.showFab = newValue
      },
      iconPainter = painterResource(R.drawable.fab)
    )
  }
}

@Composable
fun DeleteAccountSection() {
  var deletionError by remember { mutableStateOf<String?>(null) }
  val context = LocalContext.current
  val coroutineScope = rememberCoroutineScope()

  val handleDeleteAccount: () -> Unit = {
    deletionError = null

    coroutineScope.launch {
      try {
        val redirectBase = "expauth://after-delete"
        val encodedRedirect = Uri.encode(redirectBase)
        val authSessionURL =
          "https://expo.dev/settings/delete-user-expo-go?post_delete_redirect_uri=$encodedRedirect"

        val intent = Intent(Intent.ACTION_VIEW, authSessionURL.toUri()).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      } catch (e: Exception) {
        deletionError = e.message ?: "An unknown error occurred"
      }
    }
  }

  LabeledGroup(label = "Delete Account") {
    Column(
      modifier = Modifier
        .padding(
          start = 16.dp,
          top = 16.dp,
          end = 16.dp,
          bottom = 8.dp
        )
    ) {
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
          onClick = handleDeleteAccount,
          colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.errorContainer,
            contentColor = MaterialTheme.colorScheme.error
          ),
          shape = RoundedCornerShape(4.dp),
          border = BorderStroke(1.dp, MaterialTheme.colorScheme.error)
        ) {
          Text("Delete Account")
        }
      }
    }
  }
}
