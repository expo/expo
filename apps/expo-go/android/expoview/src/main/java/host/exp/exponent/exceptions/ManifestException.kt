// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.exceptions

import host.exp.exponent.Constants
import host.exp.expoview.ExpoViewBuildConfig
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.lang.Exception
import java.lang.NumberFormatException

class ManifestException : ExponentException {
  private val manifestUrl: String
  private var errorJSON: JSONObject? = null
  val errorHeader: String?
    get() = errorJSON?.let {
      try {
        when (it.getString("errorCode")) {
          "EXPERIENCE_SDK_VERSION_OUTDATED" -> "Project is incompatible with this version of Expo Go"
          "EXPERIENCE_SDK_VERSION_TOO_NEW" -> "Project is incompatible with this version of Expo Go"
          "SNACK_NOT_FOUND_FOR_SDK_VERSION" -> "This Snack is incompatible with this version of Expo Go"
          else -> null
        }
      } catch (e: JSONException) {
        null
      }
    }

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
      " Are you sure expo-cli is running?"
    } else {
      ""
    }

    return when (manifestUrl) {
      else -> {
        var formattedMessage = "Could not load $manifestUrl.$extraMessage"
        val supportedSdks = Constants.SDK_VERSIONS_LIST.map {
          it.substring(0, it.indexOf('.')).toInt()
        }.sorted()
        val supportedSdksString = { conjunction: String ->
          supportedSdks.subList(0, supportedSdks.size - 1)
            .joinToString(", ") + " $conjunction ${supportedSdks.last()}"
        }

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
                val sdkVersionRequired = availableSDKVersions.getString(0).let {
                  it.substring(0, it.indexOf('.'))
                }

                formattedMessage =
                  "This project uses SDK $sdkVersionRequired, but this version of Expo Go supports only SDKs ${supportedSdksString("and")}.<br><br>" +
                  "To open this project:<br>" +
                  "• Update it to SDK ${supportedSdksString("or")}.<br>" +
                  "• Install an older version of Expo Go that supports the project's SDK version.<br><br>" +
                  "If you are unsure how to update the project or install a suitable version of Expo Go, refer to the <a href='https://docs.expo.dev/get-started/expo-go/#sdk-versions'>SDK Versions Guide</a>."
              }
              "SNACK_NOT_FOUND_FOR_SDK_VERSION" -> {
                formattedMessage =
                  "Incompatible SDK version or no SDK version specified. This version of Expo Go only supports the following SDKs (runtimes): " + Constants.SDK_VERSIONS_LIST.joinToString() + ". A development build must be used to load other runtimes.<br><a href='https://docs.expo.dev/develop/development-builds/introduction/'>Learn more about development builds</a>."
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
              "SNACK_NOT_FOUND_FOR_SDK_VERSION" -> run closure@{
                val metadata = errorJSON!!.getJSONObject("metadata")
                val fullName = metadata["fullName"] ?: ""
                val snackSdkVersion =
                  (metadata["sdkVersions"] as? JSONArray)?.get(0) as? String ?: "unknown"

                if (snackSdkVersion == "unknown" || snackSdkVersion.indexOf(".") == -1) {
                  formattedMessage = rawMessage
                  return@closure
                }

                val snackSdkVersionValue = try {
                  Integer.parseInt(snackSdkVersion.substring(0, snackSdkVersion.indexOf(".")))
                } catch (e: NumberFormatException) {
                  formattedMessage = rawMessage
                  return@closure
                }
                formattedMessage =
                  "The snack \"${fullName}\" was found, but it is not compatible with your version of Expo Go. It was released for SDK $snackSdkVersionValue, but your Expo Go supports only SDKs ${supportedSdksString("and")}."
                formattedMessage += if (supportedSdks.last() < snackSdkVersionValue) {
                  "<br><br>You need to update your Expo Go app in order to run this Snack."
                } else {
                  "<br><br>Snack needs to be upgraded to a current SDK version. To do it, open the project at <a href='https://snack.expo.dev'>Expo Snack website</a>. It will be automatically upgraded to a supported SDK version."
                }
                formattedMessage += "<br><br><a href='https://docs.expo.dev/get-started/expo-go/#sdk-versions'>Learn more about SDK versions and Expo Go</a>."
              }
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
