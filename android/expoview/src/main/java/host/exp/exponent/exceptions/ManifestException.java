// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.exceptions;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.Constants;
import host.exp.expoview.ExpoViewBuildConfig;

public class ManifestException extends ExponentException {

  private String mManifestUrl;
  private JSONObject mErrorJSON;

  public ManifestException(final Exception originalException, final String manifestUrl) {
    super(originalException);
    mManifestUrl = manifestUrl;
    mErrorJSON = null;
  }

  public ManifestException(final Exception originalException, final String manifestUrl, final JSONObject errorJSON) {
    super(originalException);
    mErrorJSON = errorJSON;
    mManifestUrl = manifestUrl;
  }

  @Override
  public String toString() {
    String extraMessage = "";
    if (ExpoViewBuildConfig.DEBUG) {
      // This will get hit in a detached app.
      extraMessage = " Are you sure expo-cli is running?";
    }

    if (mManifestUrl == null) {
      return "Could not load project." + extraMessage;
    } else if (mManifestUrl.equals(Constants.INITIAL_URL)) {
      //
      return "Could not load app." + extraMessage;
    } else {
      String formattedMessage = "Could not load " + mManifestUrl + "." + extraMessage;
      if (mErrorJSON != null) {
        try {
          String errorCode = mErrorJSON.getString("errorCode");
          String rawMessage = mErrorJSON.getString("message");
          switch(errorCode) {
            case "EXPERIENCE_NOT_FOUND": // Really doesn't exist
            case "EXPERIENCE_NOT_PUBLISHED_ERROR": // Not published
            case "EXPERIENCE_RELEASE_NOT_FOUND_ERROR": // Can't find a release for the requested release channel
              formattedMessage = "No project found at " + mManifestUrl + ".";
              break;
            case "EXPERIENCE_SDK_VERSION_OUTDATED":
              JSONObject metadata = mErrorJSON.getJSONObject("metadata");
              JSONArray availableSDKVersions = metadata.getJSONArray("availableSDKVersions");
              String sdkVersionRequired = availableSDKVersions.getString(0);
              formattedMessage = "This project uses SDK v" + sdkVersionRequired + " , but this version of Expo Go requires at least v" + Constants.SDK_VERSIONS_LIST.get(Constants.SDK_VERSIONS_LIST.size() - 1) + ".";
              break;
            case "EXPERIENCE_SDK_VERSION_TOO_NEW":
              formattedMessage = "This project requires a newer version of Expo Go - please download the latest version from the Play Store.";
              break;
            case "EXPERIENCE_NOT_VIEWABLE":
              formattedMessage = rawMessage; // From server: The experience you requested is not viewable by you. You will need to log in or ask the owner to grant you access.
              break;
            case "USER_SNACK_NOT_FOUND":
            case "SNACK_NOT_FOUND":
              formattedMessage = "No snack found at " + mManifestUrl + ".";
              break;
            case "SNACK_RUNTIME_NOT_RELEASED":
              formattedMessage = rawMessage; // From server: `The Snack runtime for corresponding sdk version of this Snack ("${sdkVersions[0]}") is not released.`,
              break;
            case "SNACK_NOT_FOUND_FOR_SDK_VERSION":
              formattedMessage = rawMessage; // From server: `The snack "${fullName}" was found, but wasn't released for platform "${platform}" and sdk version "${sdkVersions[0]}".`
              break;
          }
        } catch (JSONException e) {
          return formattedMessage;
        }
      }
      return formattedMessage;
    }
  }
}
