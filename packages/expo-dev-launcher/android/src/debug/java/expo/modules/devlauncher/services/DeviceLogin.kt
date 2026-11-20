package expo.modules.devlauncher.services

import android.net.Uri
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devlauncher.compose.Session
import expo.modules.devlauncher.helpers.await
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/** The `__expo_device_*` params of a launch URL. */
data class DeviceLoginRequest(
  val deviceCode: String,
  val matchValue: String,
  val clientId: String
) {
  companion object {
    fun parse(uri: Uri): DeviceLoginRequest? {
      if (!uri.isHierarchical) {
        return null
      }
      fun query(name: String) = uri.getQueryParameter(name)?.takeIf { it.isNotEmpty() }

      return DeviceLoginRequest(
        deviceCode = query("__expo_device_code") ?: return null,
        matchValue = query("__expo_device_match") ?: return null,
        clientId = query("__expo_device_client") ?: return null
      )
    }
  }
}

/**
 * Signs the launcher in from a launch URL. The tool that opens the URL (Expo CLI, Expo Orbit)
 * creates an OAuth device code and approves it with its own session; the launcher exchanges the
 * code for a session of its own. Every failure is silent: the launch continues signed out.
 */
suspend fun signInFromLaunchUrl(uri: Uri) {
  val sessionService = DependencyInjection.sessionService ?: return
  // Emulator only: on a device, a link from another app could sign the launcher in to the
  // sender's account.
  if (!EmulatorUtilities.isRunningOnEmulator() || Session.loadFromPreferences(sessionService.sessionStore) != null) {
    return
  }
  val request = DeviceLoginRequest.parse(uri) ?: return

  runCatching {
    val payload = JSONObject()
      .put("grant_type", "urn:ietf:params:oauth:grant-type:device_code")
      .put("client_id", request.clientId)
      .put("device_code", request.deviceCode)
      .put("match_value", request.matchValue)
      .toString()
    val response = Request
      .Builder()
      .url("https://api.expo.dev/v2/auth/token")
      .post(payload.toRequestBody("application/json".toMediaType()))
      .build()
      .await(DependencyInjection.httpClientService.httpClient)
    val sessionSecret = response.use { JSONObject(it.body?.string().orEmpty()) }
      .getJSONObject("data")
      .getString("session_secret")
    sessionService.setSession(Session(sessionSecret))
  }
}
