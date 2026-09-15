package host.exp.exponent.home

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import host.exp.exponent.network.LocalNetworkPermission
import host.exp.expoview.R

/**
 * Shown on Android 17+ until local network access is granted. Tapping asks for the permission, or
 * opens the app's settings once the system no longer shows the prompt.
 */
@Composable
fun LocalNetworkPermissionBanner(viewModel: HomeAppViewModel) {
  val isGranted by viewModel.isLocalNetworkPermissionGranted.collectAsStateWithLifecycle()
  if (isGranted) {
    return
  }

  val context = LocalContext.current
  val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
    viewModel.refreshLocalNetworkPermission()
  }

  Spacer(modifier = Modifier.height(16.dp))

  Surface(
    onClick = {
      if (LocalNetworkPermission.canPrompt(context)) {
        LocalNetworkPermission.markPrompted(context)
        launcher.launch(LocalNetworkPermission.PERMISSION)
      } else {
        val settings = Intent(
          Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
          Uri.fromParts("package", context.packageName, null)
        )
        context.startActivity(settings)
      }
    },
    modifier = Modifier.padding(horizontal = 16.dp),
    shape = RoundedCornerShape(12.dp),
    color = MaterialTheme.colorScheme.secondaryContainer,
    contentColor = MaterialTheme.colorScheme.onSecondaryContainer
  ) {
    Row(
      modifier = Modifier.padding(16.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      Icon(
        painter = painterResource(id = R.drawable.warning),
        contentDescription = null,
        modifier = Modifier.size(24.dp)
      )
      Column(
        modifier = Modifier
          .weight(1f)
          .padding(horizontal = 12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
      ) {
        Text(
          "Local network access needed",
          fontWeight = FontWeight.Bold,
          style = MaterialTheme.typography.labelLarge
        )
        Text(
          "Projects running on your computer can't be discovered. Tap to enable access.",
          style = MaterialTheme.typography.bodySmall
        )
      }
      Icon(
        painter = painterResource(id = R.drawable.chevron_right),
        contentDescription = null
      )
    }
  }
}
