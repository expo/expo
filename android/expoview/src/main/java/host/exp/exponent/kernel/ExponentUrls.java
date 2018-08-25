// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import android.net.Uri;

import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.Constants;
import expolib_v1.okhttp3.Request;

public class ExponentUrls {

  private static final List<String> HTTPS_HOSTS = new ArrayList<>();
  static {
    HTTPS_HOSTS.add("exp.host");
    HTTPS_HOSTS.add("exponentjs.com");
  }

  private static boolean isHttpsHost(final String host) {
    for (int i = 0; i < HTTPS_HOSTS.size(); i++) {
      if (HTTPS_HOSTS.get(i).equals(host)) {
        return true;
      }
    }

    return false;
  }

  public static String toHttp(final String rawUrl) {
    if (rawUrl.startsWith("http")) {
      return rawUrl;
    }

    Uri uri = Uri.parse(rawUrl);
    boolean useHttps = isHttpsHost(uri.getHost()) || rawUrl.startsWith("exps");
    return uri.buildUpon().scheme(useHttps ? "https" : "http").build().toString();
  }

  public static Request.Builder addExponentHeadersToUrl(String urlString, boolean isShellAppManifest, boolean isKernel) {
    // TODO: set user agent
    String sdkVersions = Constants.SDK_VERSIONS;
    // !isKernel is important for when FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES is set to true
    if (KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES && !isKernel) {
      sdkVersions = "UNVERSIONED";
    }
    Request.Builder builder = new Request.Builder()
        .url(urlString)
        .header("Exponent-SDK-Version", sdkVersions)
        .header("Exponent-Platform", "android")
        .header("Accept", "application/expo+json,application/json");

    if (isShellAppManifest) {
      builder.header("Expo-Release-Channel", Constants.RELEASE_CHANNEL);
    }

    if (ExpoViewKernel.getInstance().getVersionName() != null) {
      builder = builder.header("Exponent-Version", ExpoViewKernel.getInstance().getVersionName());
    }

    return builder;
  }
}
