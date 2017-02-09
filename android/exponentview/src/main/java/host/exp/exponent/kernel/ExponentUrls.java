// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import android.net.Uri;

import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.Constants;
import okhttp3.Request;

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

  public static Request.Builder addExponentHeadersToUrl(String urlString) {
    // TODO: set user agent
    String sdkVersions = Constants.SDK_VERSIONS;
    if (KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES) {
      sdkVersions = "UNVERSIONED";
    }
    Request.Builder builder = new Request.Builder()
        .url(urlString)
        .header("Exponent-SDK-Version", sdkVersions)
        .header("Exponent-Platform", "android");

    if (ExponentViewKernel.getInstance().getVersionName() != null) {
      builder = builder.header("Exponent-Version", ExponentViewKernel.getInstance().getVersionName());
    }

    return builder;
  }
}
