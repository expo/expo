package host.exp.exponent.home

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.core.content.edit
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.expoview.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException

private data class VersionsApiResponse(
  @SerializedName("sdkVersions") val sdkVersions: Map<String, SdkVersionInfo> = emptyMap()
)

private data class SdkVersionInfo(
  @SerializedName("releaseNoteUrl") val releaseNoteUrl: String? = null
)

private val SDK_VERSION_REGEX = """(\d+)\.\d+\.\d+""".toRegex()

private val gson = Gson()
private val client = OkHttpClient()

private val MODAL_DISMISSED_PREF_KEY = "expo_go_upgrade_warning"

private suspend fun shouldShowUpgradeWarning(context: Context): Pair<Boolean, String?> {
//  Don't show on emulators
  if (android.os.Build.MODEL.contains("google_sdk") ||
    android.os.Build.MODEL.contains("Emulator")
  ) {
    return false to null
  }
  val request = Request.Builder()
    .url("https://api.expo.dev/v2/versions")
    .build()

  try {
    val response = withContext(Dispatchers.IO) {
      client.newCall(request).execute()
    }

    if (!response.isSuccessful) return false to null
    val responseBody = response.body?.string() ?: return false to null
    val data = gson.fromJson(responseBody, VersionsApiResponse::class.java)

    // Extract, sort, and filter SDK versions
    val publishedVersions = data.sdkVersions.entries
      .mapNotNull { (sdkString, info) ->
        SDK_VERSION_REGEX.find(sdkString)?.groupValues?.get(1)?.let { sdk ->
          Pair(sdk, info)
        }
      }
      .sortedBy { it.first.toIntOrNull() ?: 0 }

    if (publishedVersions.size < 2) return false to null

    val lastVersion = publishedVersions.last()
    val penultimateVersion = publishedVersions[publishedVersions.size - 2]

    val currentGoMajorVersion = ExponentBuildConstants.TEMPORARY_SDK_VERSION.split(".").first()
    val currentIsLatestPublished = currentGoMajorVersion == penultimateVersion.first
    val latestIsBeta = lastVersion.second.releaseNoteUrl == null

    val shouldShow = currentIsLatestPublished && latestIsBeta
    val betaSdkVersion = lastVersion.first

    if (shouldShow) {
      val prefs = context.getSharedPreferences(MODAL_DISMISSED_PREF_KEY, Context.MODE_PRIVATE)
      val dismissed = prefs.getBoolean("dismissed_$betaSdkVersion", false)
      if (dismissed) {
        return false to null
      }
    }

    return shouldShow to betaSdkVersion
  } catch (e: IOException) {
    return false to null
  }
}

@Composable
fun UpgradeWarning() {
  val context = LocalContext.current
  var shouldShow by remember { mutableStateOf(false) }
  var betaSdkVersion by remember { mutableStateOf<String?>(null) }

  LaunchedEffect(Unit) {
    val (show, sdkVersion) = shouldShowUpgradeWarning(context)
    shouldShow = show
    betaSdkVersion = sdkVersion
  }

  if (!shouldShow) {
    return
  }

  fun dismissWarning() {
    shouldShow = false
    betaSdkVersion?.let {
      context.getSharedPreferences(MODAL_DISMISSED_PREF_KEY, Context.MODE_PRIVATE)
        .edit {
          putBoolean("dismissed_$it", true)
        }
    }
  }

  Spacer(modifier = Modifier.height(16.dp))

  Surface(
    modifier = Modifier.padding(horizontal = 16.dp),
    shape = RoundedCornerShape(12.dp),
    color = MaterialTheme.colorScheme.errorContainer,
    contentColor = MaterialTheme.colorScheme.onErrorContainer
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
        modifier = Modifier.fillMaxWidth()
      ) {
        Icon(
          painter = painterResource(id = R.drawable.warning),
          contentDescription = "Warning",
          modifier = Modifier
            .size(24.dp)
        )
        Text(
          "New Expo Go version coming soon!",
          fontWeight = FontWeight.Bold,
          style = MaterialTheme.typography.labelLarge,
          modifier = Modifier
            .weight(1f)
            .padding(start = 8.dp)
        )
        IconButton(onClick = { dismissWarning() }, modifier = Modifier.size(24.dp)) {
          Icon(painter = painterResource(id = R.drawable.close), contentDescription = "Dismiss")
        }
      }

      val warningText = buildAnnotatedString {
        append("A new version of Expo Go will be released to the store soon, and it will ")
        withStyle(style = SpanStyle(fontWeight = FontWeight.SemiBold)) {
          append("only support SDK $betaSdkVersion")
        }
        append(".")
      }
      Text(warningText, style = MaterialTheme.typography.bodySmall)

      Message()
    }
  }
}

@Composable
private fun Message() {
  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    Text(
      "If you have automatic updates enabled for this app, we recommend disabling it to avoid disruption.",
      style = MaterialTheme.typography.bodySmall
    )
    val textPart2 = buildAnnotatedString {
      append("If you ever need to open a project from an earlier SDK version, install the ")
      pushLink(LinkAnnotation.Url("https://expo.dev/go"))
      withStyle(
        style = SpanStyle(
          color = MaterialTheme.colorScheme.primary,
          fontWeight = FontWeight.SemiBold
        )
      ) {
        append("compatible version")
      }
      pop()
      append(" of Expo Go.")
    }

    Text(
      text = textPart2,
      style = MaterialTheme.typography.bodySmall
    )
  }
}
