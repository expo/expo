package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.graphql.BranchDetailsQuery
import host.exp.exponent.graphql.BranchesForProjectQuery

private fun isUpdateCompatible(sdkVersion: String?): Boolean {
  if (sdkVersion == null) return false
  val expoGoMajorVersion = ExponentBuildConstants.TEMPORARY_SDK_VERSION.split(".").firstOrNull()
  val updateMajorVersion = sdkVersion.split(".").firstOrNull()
  return expoGoMajorVersion != null && expoGoMajorVersion == updateMajorVersion
}

private fun toExp(httpUrl: String): String {
  return try {
    val uri = httpUrl.toUri()
    uri.buildUpon().scheme("exp").build().toString()
  } catch (_: Exception) {
    httpUrl
  }
}

private fun openUpdateManifestPermalink(
  uriHandler: androidx.compose.ui.platform.UriHandler,
  manifestPermalink: String
) {
  val expUrl = toExp(manifestPermalink)
  uriHandler.openUri(normalizeUrl(expUrl))
}

@Composable
private fun UpdateRowContents(
  message: String?,
  createdAt: String?,
  runtimeVersion: String?,
  omitCompatibility: Boolean
) {
  val isCompatible = isUpdateCompatible(runtimeVersion)

  Text(
    text = message ?: "No message",
    style = MaterialTheme.typography.bodySmall,
    fontWeight = FontWeight.Medium,
    maxLines = 2,
    modifier = Modifier.padding(bottom = 4.dp)
  )
  Text(
    text = "Published: " + formatIsoDateTime(createdAt),
    style = MaterialTheme.typography.bodySmall
  )
  if (!isCompatible && !omitCompatibility) {
    ItemRowTag(
      text = "Not compatible with this version of Expo Go",
      modifier = Modifier.padding(top = 4.dp)
    )
  }
}

@Composable
fun UpdateRow(
  update: BranchesForProjectQuery.Update,
  omitCompatibility: Boolean = false
) {
  val uriHandler = LocalUriHandler.current
  val isCompatible = isUpdateCompatible(update.updateData.runtimeVersion)

  val modifier = if (isCompatible) {
    Modifier.clickable {
      update.updateData.manifestPermalink.let {
        openUpdateManifestPermalink(uriHandler, it)
      }
    }
  } else {
    Modifier
  }

  Column(modifier = modifier) {
    UpdateRowContents(
      message = update.updateData.message,
      createdAt = update.updateData.createdAt as? String,
      runtimeVersion = update.updateData.runtimeVersion,
      omitCompatibility = omitCompatibility
    )
  }
}

@Composable
fun UpdateRow(
  update: BranchDetailsQuery.Update,
  omitCompatibility: Boolean = false
) {
  val uriHandler = LocalUriHandler.current
  val isCompatible = isUpdateCompatible(update.updateData.runtimeVersion)

  val modifier = if (isCompatible) {
    Modifier.clickable {
      update.updateData.manifestPermalink.let {
        openUpdateManifestPermalink(uriHandler, it)
      }
    }
  } else {
    Modifier
  }

  Column(modifier = modifier.padding(vertical = 8.dp, horizontal = 16.dp)) {
    UpdateRowContents(
      message = update.updateData.message,
      createdAt = update.updateData.createdAt as? String,
      runtimeVersion = update.updateData.runtimeVersion,
      omitCompatibility = omitCompatibility
    )
  }
}
