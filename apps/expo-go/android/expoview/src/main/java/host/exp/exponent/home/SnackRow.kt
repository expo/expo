package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.graphql.Home_AccountSnacksQuery

private fun getMajorVersion(version: String): String {
  return version.split(".").firstOrNull() ?: version
}

private fun isSupportedSdkVersion(sdkVersion: String): Boolean {
  val supportedMajor = getMajorVersion(ExponentBuildConstants.TEMPORARY_SDK_VERSION)
  val snackMajor = getMajorVersion(sdkVersion)
  return supportedMajor == snackMajor
}

@Composable
fun SnackRow(snack: Home_AccountSnacksQuery.Snack) {
  val uriHandler = LocalUriHandler.current
  val isSupported = isSupportedSdkVersion(snack.commonSnackData.sdkVersion)
  var showUnsupportedDialog by remember { mutableStateOf(false) }

  val handleClick = {
    if (isSupported) {
      uriHandler.openUri(normalizeSnackUrl(snack.commonSnackData.fullName))
    } else {
      showUnsupportedDialog = true
    }
  }

  if (showUnsupportedDialog) {
    val snackMajorVersion = getMajorVersion(snack.commonSnackData.sdkVersion)
    val goMajorVersion = getMajorVersion(ExponentBuildConstants.TEMPORARY_SDK_VERSION)

    AlertDialog(
      onDismissRequest = { showUnsupportedDialog = false },
      title = { Text("Unsupported SDK (${snackMajorVersion})") },
      text = { Text("The currently running version of Expo Go supports SDK $goMajorVersion only. Update your Snack to this version to run it.") },
      confirmButton = {
        TextButton(onClick = { showUnsupportedDialog = false }) {
          Text("OK")
        }
      }
    )
  }

  Row(
    modifier = Modifier
      .fillMaxWidth()
      .clickable(onClick = handleClick)
      .padding(16.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    Column(
      modifier = Modifier
        .weight(1f)
        .alpha(if (isSupported) 1f else 0.5f)
    ) {
      Text(
        text = snack.commonSnackData.name,
        fontWeight = FontWeight.Medium
      )
      if (snack.commonSnackData.description.isNotBlank() && snack.commonSnackData.description != "No description") {
        Spacer(modifier = Modifier.height(4.dp))
        Text(
          text = snack.commonSnackData.description,
          style = MaterialTheme.typography.bodySmall,
        )
      }
      if (snack.commonSnackData.isDraft || !isSupported) {
        Spacer(modifier = Modifier.height(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          if (!isSupported) {
            ItemRowTag("Unsupported SDK (${getMajorVersion(snack.commonSnackData.sdkVersion)})")
          }
          if (snack.commonSnackData.isDraft) {
            ItemRowTag("Draft")
          }
        }
      }
    }
  }
}


