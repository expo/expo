package org.unimodules.apploader;

import android.content.Context;

import org.unimodules.core.interfaces.Consumer;

public interface HeadlessAppLoader {

  class AppConfigurationError extends Exception {

    public AppConfigurationError(String message) {
      super(message);
    }

    public AppConfigurationError(String message, Exception cause) {
      super(message, cause);
    }
  }

  void loadApp(Context context, Params params, Runnable alreadyRunning, Consumer<Boolean> callback) throws AppConfigurationError;

  boolean invalidateApp(String appId);

  boolean isRunning(String appId);

  final class Params {
    private final String appId;
    private final String appUrl;

    public Params(String appId, String appUrl) {
      this.appId = appId;
      this.appUrl = appUrl;
    }

    public String getAppId() {
      return appId;
    }

    public String getAppUrl() {
      return appUrl;
    }

  }

}
