package host.exp.exponent.home

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.UriHandler
import host.exp.exponent.network.LocalNetworkPermission

/**
 * Wraps the platform [UriHandler] so opening a project on the local network asks for the permission
 * first. The URL opens once the prompt is answered either way; a denied request fails the same way an
 * unprompted one did, and the Home banner offers the way to Settings.
 */
@Composable
fun rememberLocalNetworkGatedUriHandler(
  viewModel: HomeAppViewModel,
  onOpenError: (String) -> Unit
): UriHandler {
  val context = LocalContext.current
  val platformHandler = LocalUriHandler.current
  val pendingUrl = remember { mutableStateOf<String?>(null) }
  val open: (String) -> Unit = { uri -> openUriOrShowError(platformHandler, uri, onOpenError) }
  val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
    viewModel.refreshLocalNetworkPermission()
    pendingUrl.value?.let(open)
    pendingUrl.value = null
  }

  return remember(platformHandler) {
    object : UriHandler {
      override fun openUri(uri: String) {
        val needsPrompt = LocalNetworkPermission.isLocalNetworkUrl(uri) &&
          !LocalNetworkPermission.isGranted(context) &&
          LocalNetworkPermission.canPrompt(context)
        if (needsPrompt) {
          LocalNetworkPermission.markPrompted(context)
          pendingUrl.value = uri
          launcher.launch(LocalNetworkPermission.PERMISSION)
        } else {
          open(uri)
        }
      }
    }
  }
}
