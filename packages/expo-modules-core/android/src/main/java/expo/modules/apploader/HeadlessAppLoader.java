package expo.modules.apploader;

import android.content.Context;

import expo.modules.core.interfaces.Consumer;

public interface HeadlessAppLoader {
  void loadApp(Context context, Params params, Runnable alreadyRunning, Consumer<Boolean> callback);

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
