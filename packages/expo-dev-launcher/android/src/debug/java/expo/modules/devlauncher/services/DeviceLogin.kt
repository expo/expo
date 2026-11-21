package expo.modules.devlauncher.services

import android.net.Uri
import android.util.Log
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devlauncher.compose.Session
import expo.modules.devlauncher.helpers.await
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

private const val TAG = "DevLauncherDeviceLogin"

/** Set by a sign out and cleared by a sign in: a launch URL does not undo a sign out. */
internal const val SIGNED_OUT_KEY = "signed_out"

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
 * code for a session of its own. A failure only writes a log line: the launch continues signed out.
 */
suspend fun signInFromLaunchUrl(uri: Uri) {
  val sessionService = DependencyInjection.sessionService ?: return
  val sessionStore = sessionService.sessionStore
  // Emulator only: on a device, a link from another app could sign the launcher in to the
  // sender's account. The check reads `Build` properties, so a device with a custom ROM can pass
  // it. That is the accepted risk: this file is only in debug builds.
  if (!EmulatorUtilities.isRunningOnEmulator() ||
    Session.loadFromPreferences(sessionStore) != null ||
    sessionStore.getBoolean(SIGNED_OUT_KEY, false)
  ) {
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
    val data = response.use { JSONObject(it.body?.string().orEmpty()) }.getJSONObject("data")
    if (!data.has("session_secret")) {
      // Only the server error code: never log the device code or the session secret.
      Log.w(TAG, "Could not sign in from the launch URL: ${data.optString("error")}")
      return
    }
    sessionService.setSession(Session(data.getString("session_secret")))
  }.onFailure {
    // Only the class: the message of a JSON error can contain the response body.
    Log.w(TAG, "Could not sign in from the launch URL: ${it.javaClass.simpleName}")
  }
}
