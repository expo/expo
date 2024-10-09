// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.exceptions

import host.exp.exponent.Constants
import host.exp.expoview.ExpoViewBuildConfig
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.lang.Exception
import java.lang.NumberFormatException
import expo.modules.core.utilities.EmulatorUtilities.isRunningOnEmulator

private const val SNACK_STAGING = "2dce2748-c51f-4865-bae0-392af794d60a"
private const val SNACK_PROD = "933fd9c0-1666-11e7-afca-d980795c5824"

class ManifestException : ExponentException {
  private val manifestUrl: String
  private var errorJSON: JSONObject? = null
  private lateinit var errorMessage: String
  private var fixInstructions: String? = null
  private val isSnackURL: Boolean
    get() =
      manifestUrl.contains(SNACK_STAGING) || manifestUrl.contains(SNACK_PROD)

  var canRetry: Boolean = true
  val errorHeader: String?
    get() = errorJSON?.let {
      try {
        when (it.getString("errorCode")) {
          "EXPERIENCE_SDK_VERSION_OUTDATED" -> {
            val projectType = if (isSnackURL) "This Snack" else "Project"
            "$projectType is incompatible with this version of Expo Go"
          }
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
    processException()
  }

  constructor(originalException: Exception?, manifestUrl: String, errorJSON: JSONObject?) : super(
    originalException
  ) {
    this.errorJSON = errorJSON
    this.manifestUrl = manifestUrl
    processException()
  }

  private fun processException() {
    val extraMessage = if (ExpoViewBuildConfig.DEBUG) {
      " Are you sure expo-cli is running?"
    } else {
      ""
    }

    var formattedMessage = "Could not load $manifestUrl.$extraMessage"
    val supportedSdk = Constants.SDK_VERSION.let {
      it.substring(0, it.indexOf('.')).toInt()
    }

    errorJSON?.let { errorJSON ->
      try {
        val errorCode = errorJSON.getString("errorCode")
        val rawMessage = errorJSON.getString("message")
        when (errorCode) {
          "EXPERIENCE_NOT_FOUND", // Really doesn't exist
          "EXPERIENCE_NOT_PUBLISHED_ERROR", // Not published
          "EXPERIENCE_RELEASE_NOT_FOUND_ERROR" -> // Can't find a release for the requested release channel
            formattedMessage = "No project found at $manifestUrl."

          "EXPERIENCE_SDK_VERSION_OUTDATED" -> {
            val metadata = errorJSON.getJSONObject("metadata")
            val availableSDKVersions = metadata.getJSONArray("availableSDKVersions")
            val sdkVersionRequired = availableSDKVersions.getString(0).let {
              it.substring(0, it.indexOf('.'))
            }
            val expoDevLink =
              "https://expo.dev/go?sdkVersion=$sdkVersionRequired&platform=android&device=${!isRunningOnEmulator()}"

            val projectType = if (isSnackURL) "snack" else "project"

            formattedMessage =
              "• The installed version of Expo Go is for <b>SDK $supportedSdk</b>.<br>" +
                  "• The $projectType you opened uses <b>SDK $sdkVersionRequired</b>."
            fixInstructions = if (isSnackURL) {
              "Either select SDK $supportedSdk on <a href='https:/snack.expo.dev/'>https:/snack.expo.dev/</a> or install an older version of Expo Go that is compatible with your project." +
                  "<br>If your required SDK version is not listed on Snack, use an emulator or one of the online emulators inside of Snack<br><br>"
            } else {
              "Either upgrade this project to SDK $supportedSdk or install an older version of Expo Go that is compatible with ${if (isSnackURL) "this" else "your"} $projectType.<br><br>" +
                  "<a href='https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/'>Learn how to upgrade to SDK $supportedSdk.</a><br><br>"
            } + "<a href='$expoDevLink'>Learn how to install Expo Go for SDK $sdkVersionRequired</a>."
            canRetry = false
          }

          "EXPERIENCE_SDK_VERSION_TOO_NEW" -> {
            formattedMessage = "This project requires a newer version of Expo Go."
            fixInstructions = "Download the latest version of Expo Go from the Play Store."
            canRetry = false
          }

          "EXPERIENCE_NOT_VIEWABLE" -> {
            formattedMessage = "The experience you requested is not viewable by you."
            fixInstructions =
              "You need to log in. If the snack is still unavailable after logging in, ask the owner to grant you access."
          }

          "USER_SNACK_NOT_FOUND", "SNACK_NOT_FOUND" ->
            formattedMessage = "No snack found at $manifestUrl."

          "SNACK_RUNTIME_NOT_RELEASED" ->
            formattedMessage =
              rawMessage // From server: `The Snack runtime for corresponding sdk version of this Snack ("${sdkVersions[0]}") is not released.`,

          "SNACK_NOT_FOUND_FOR_SDK_VERSION" -> run closure@{
            val metadata = errorJSON.getJSONObject("metadata")
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
              "The snack \"${fullName}\" was found, but it is not compatible with your version of Expo Go. It was released for SDK $snackSdkVersionValue, but your Expo Go supports only SDK $supportedSdk."

            fixInstructions = if (supportedSdk < snackSdkVersionValue) {
              "You need to update your Expo Go app in order to run this Snack."
            } else {
              "Snack needs to be upgraded to a current SDK version. To do it, open the project at <a href='https://snack.expo.dev'>Expo Snack website</a>. It will be automatically upgraded to a supported SDK version."
            }
            fixInstructions += "<br><br><a href='https://docs.expo.dev/get-started/expo-go/#sdk-versions'>Learn more about SDK versions and Expo Go</a>."
            canRetry = false
          }
        }
      } catch (e: JSONException) {
        errorMessage = formattedMessage
        fixInstructions = null
        canRetry = true
      }
    }
    errorMessage = formattedMessage
  }

  override fun toString(): String {
    if (fixInstructions != null) {
      return "$errorMessage<br><br><h5><b>How to fix this error</b></h5>$fixInstructions"
    }
    return errorMessage
  }
}
