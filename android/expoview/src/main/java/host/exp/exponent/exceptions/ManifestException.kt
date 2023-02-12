// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.exceptions

import host.exp.exponent.Constants
import host.exp.expoview.ExpoViewBuildConfig
import org.json.JSONException
import org.json.JSONObject
import java.lang.Exception

class ManifestException : ExponentException {
  private val manifestUrl: String
  private var errorJSON: JSONObject? = null

  constructor(originalException: Exception?, manifestUrl: String) : super(originalException) {
    this.manifestUrl = manifestUrl
    this.errorJSON = null
  }

  constructor(originalException: Exception?, manifestUrl: String, errorJSON: JSONObject?) : super(
    originalException
  ) {
    this.errorJSON = errorJSON
    this.manifestUrl = manifestUrl
  }

  override fun toString(): String {
    val extraMessage = if (ExpoViewBuildConfig.DEBUG) {
      // This will get hit in a detached app.
      " Are you sure expo-cli is running?"
    } else {
      ""
    }

    return when (manifestUrl) {
      Constants.INITIAL_URL -> "Could not load app.$extraMessage"
      else -> {
        var formattedMessage = "Could not load $manifestUrl.$extraMessage"
        if (errorJSON != null) {
          try {
            val errorCode = errorJSON!!.getString("errorCode")
            val rawMessage = errorJSON!!.getString("message")
            when (errorCode) {
              "EXPERIENCE_NOT_FOUND", // Really doesn't exist
              "EXPERIENCE_NOT_PUBLISHED_ERROR", // Not published
              "EXPERIENCE_RELEASE_NOT_FOUND_ERROR" -> // Can't find a release for the requested release channel
                formattedMessage =
                  "No project found at $manifestUrl."
              "EXPERIENCE_SDK_VERSION_OUTDATED" -> {
                val metadata = errorJSON!!.getJSONObject("metadata")
                val availableSDKVersions = metadata.getJSONArray("availableSDKVersions")
                val sdkVersionRequired = availableSDKVersions.getString(0)
                formattedMessage =
                  "This project uses SDK " + sdkVersionRequired + " , but this version of Expo Go only supports the following SDKs: " + Constants.SDK_VERSIONS_LIST.joinToString() + ". To load the project, it must be updated to a supported SDK version or an older version of Expo Go must be used."
              }
              "NO_SDK_VERSION_SPECIFIED" -> {
                formattedMessage = "Incompatible SDK version or no SDK version specified. This version of Expo Go only supports the following SDKs (runtimes): " + Constants.SDK_VERSIONS_LIST.joinToString() + ". A development build must be used to load other runtimes."
              }
              "EXPERIENCE_SDK_VERSION_TOO_NEW" ->
                formattedMessage =
                  "This project requires a newer version of Expo Go - please download the latest version from the Play Store."
              "EXPERIENCE_NOT_VIEWABLE" ->
                formattedMessage =
                  rawMessage // From server: The experience you requested is not viewable by you. You will need to log in or ask the owner to grant you access.
              "USER_SNACK_NOT_FOUND", "SNACK_NOT_FOUND" ->
                formattedMessage =
                  "No snack found at $manifestUrl."
              "SNACK_RUNTIME_NOT_RELEASED" ->
                formattedMessage =
                  rawMessage // From server: `The Snack runtime for corresponding sdk version of this Snack ("${sdkVersions[0]}") is not released.`,
              "SNACK_NOT_FOUND_FOR_SDK_VERSION" ->
                formattedMessage =
                  rawMessage // From server: `The snack "${fullName}" was found, but wasn't released for platform "${platform}" and sdk version "${sdkVersions[0]}".`
            }
          } catch (e: JSONException) {
            return formattedMessage
          }
        }
        formattedMessage
      }
    }
  }
}
