package expo.modules.apploader;

import android.content.Context;

import expo.modules.core.interfaces.Consumer;

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

  boolean invalidateApp(String appScopeKey);

  boolean isRunning(String appScopeKey);

  final class Params {
    private final String appScopeKey;
    private final String appUrl;

    public Params(String appScopeKey, String appUrl) {
      this.appScopeKey = appScopeKey;
      this.appUrl = appUrl;
    }

    public String getAppScopeKey() {
      return appScopeKey;
    }

    public String getAppUrl() {
      return appUrl;
    }

  }

}
