// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.analytics.EXL;

public class Constants {

  private static final String TAG = Constants.class.getSimpleName();

  public static final String VERSION_NAME = null;
  public static final String INITIAL_URL = null;
  public static final String SHELL_APP_SCHEME = null;
  public static final String API_HOST = "https://exp.host";
  public static final String ABI_VERSIONS;
  public static final String SDK_VERSIONS;
  public static final List<String> SDK_VERSIONS_LIST;
  public static final String TEMPORARY_ABI_VERSION = null;
  public static final String KERNEL_URL;
  public static final String EMBEDDED_KERNEL_PATH = "assets://kernel.android.bundle";
  public static final List<EmbeddedResponse> EMBEDDED_RESPONSES;

  static {
    List<String> abiVersions = new ArrayList<>();
    // THIS COMMENT IS USED BY android-build-aar.sh DO NOT MODIFY
    abiVersions.add("11.0.0");
    abiVersions.add("10.0.0");
    abiVersions.add("9.0.0");
    abiVersions.add("8.0.0");
    abiVersions.add("7.0.0");

    if (TEMPORARY_ABI_VERSION != null) {
      abiVersions.add(TEMPORARY_ABI_VERSION);
    }

    ABI_VERSIONS = TextUtils.join(",", abiVersions);

    // NOTE: Currently public-facing SDK versions and internal ABI versions are the same, but
    // eventually we may decouple them
    SDK_VERSIONS = ABI_VERSIONS;
    SDK_VERSIONS_LIST = abiVersions;

    Uri.Builder builder = new Uri.Builder();
    builder.scheme("https")
        .authority("exp.host")
        .encodedPath("/~exponent/kernel");
    KERNEL_URL = builder.build().toString();

    List<EmbeddedResponse> embeddedResponses = new ArrayList<>();
    embeddedResponses.add(new EmbeddedResponse(KERNEL_URL, EMBEDDED_KERNEL_PATH, "application/javascript"));
    // ADD EMBEDDED RESPONSES HERE
    EMBEDDED_RESPONSES = embeddedResponses;
  }

  public static final boolean DEBUG_COLD_START_METHOD_TRACING = false;
  public static final boolean DEBUG_MANIFEST_METHOD_TRACING = false;
  public static final boolean DEBUG_METHOD_TRACING = DEBUG_COLD_START_METHOD_TRACING || DEBUG_MANIFEST_METHOD_TRACING;
  public static final boolean ENABLE_LEAK_CANARY = false;
  public static final boolean WRITE_BUNDLE_TO_LOG = false;
  public static final boolean WAIT_FOR_DEBUGGER = false;

  public static boolean isShellApp() {
    return INITIAL_URL != null;
  }

  public static class EmbeddedResponse {
    public final String url;
    public final String responseFilePath;
    public final String mediaType;

    public EmbeddedResponse(final String url, final String responseFilePath, final String mediaType) {
      this.url = url;
      this.responseFilePath = responseFilePath;
      this.mediaType = mediaType;
    }
  }

  public static String getVersionName(Context context) {
    if (VERSION_NAME != null) {
      // This will be set in shell apps
      return VERSION_NAME;
    } else {
      try {
        PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
        return pInfo.versionName;
      } catch (PackageManager.NameNotFoundException e) {
        EXL.e(TAG, e.toString());
        return "";
      }
    }
  }
}
