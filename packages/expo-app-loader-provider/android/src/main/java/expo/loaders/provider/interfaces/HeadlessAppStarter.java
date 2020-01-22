package expo.loaders.provider.interfaces;

import android.content.Context;

import org.unimodules.core.interfaces.Consumer;

public interface HeadlessAppStarter {

  void startApp(Context context, Params params, Runnable alreadyRunning, Consumer<Boolean> callback) throws IllegalArgumentException, IllegalStateException;

  boolean invalidateApp(String appId);

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
