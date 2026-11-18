package expo.modules.apploader;

import android.content.Context;

import expo.modules.core.interfaces.Consumer;

public interface HeadlessAppLoader {
  void loadApp(Context context, Params params, Runnable alreadyRunning, Consumer<Boolean> callback);

  boolean invalidateApp(String appScopeKey);

  /**
   * Returns whether the app with the given appScopeKey is running in headless mode right now,
   * which means it is loaded and no Activity is attached to it.
   */
  boolean isRunningInHeadlessMode(String appScopeKey);

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
