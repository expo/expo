package host.exp.exponent.taskManager;

import android.content.Context;
import android.util.Log;

import org.unimodules.adapters.react.apploader.HeadlessAppLoaderNotifier;
import org.unimodules.apploader.AppLoaderProvider;
import org.unimodules.apploader.HeadlessAppLoader;
import org.unimodules.core.interfaces.Consumer;
import org.unimodules.core.interfaces.DoNotStrip;

import java.util.HashMap;
import java.util.Map;

import host.exp.exponent.headless.InternalHeadlessAppLoader;

@DoNotStrip
public class ExpoHeadlessAppLoader implements HeadlessAppLoader {

  private static final String TAG = "TaskManagerInternalAppL";

  private static AppLoaderInterface appLoader;

  private final HashMap<String, AppRecordInterface> appScopeKeysToAppRecords = new HashMap<>();

  @DoNotStrip
  @SuppressWarnings("unused")
  public ExpoHeadlessAppLoader(Context context) {
  }

  @Override
  public void loadApp(Context context, Params params, Runnable alreadyRunning, Consumer<Boolean> callback) throws AppConfigurationError {

    AppLoaderInterface appLoader = createAppLoader(context);

    if (appLoader == null) {
      throw new AppConfigurationError("Cannot execute background task because application loader can't be found.");
    } else if (params.getAppUrl() == null) {
      throw new AppConfigurationError("Cannot execute background task because application URL is invalid");
    } else {

      if (appScopeKeysToAppRecords.containsKey(params.getAppScopeKey())) {
        alreadyRunning.run();
      } else {
        Map<String, Object> options = new HashMap<>();

        Log.i(TAG, "Loading headless app '" + params.getAppScopeKey() + "' with url '" + params.getAppUrl() + "'.");

        AppRecordInterface appRecord = appLoader.loadApp(params.getAppUrl(), options, new AppLoaderProvider.Callback() {
          @Override
          public void onComplete(boolean success, Exception exception) {
            if (exception != null) {
              exception.printStackTrace();
              Log.e(TAG, exception.getMessage());
            }
            HeadlessAppLoaderNotifier.INSTANCE.notifyAppLoaded(params.getAppScopeKey());
            callback.apply(success);
            if (!success) {
              appScopeKeysToAppRecords.remove(params.getAppScopeKey());
            }
          }
        });

        appScopeKeysToAppRecords.put(params.getAppScopeKey(), appRecord);
      }
    }
  }

  @Override
  public boolean invalidateApp(String appScopeKey) {
    appScopeKeysToAppRecords.remove(appScopeKey);
    HeadlessAppLoaderNotifier.INSTANCE.notifyAppLoaded(appScopeKey);
    return false;
  }

  private AppLoaderInterface createAppLoader(Context context) {
    // for now only react-native apps in Expo are supported
    if (appLoader == null) {
      appLoader = new InternalHeadlessAppLoader(context);
    }
    return appLoader;
  }

  @Override
  public boolean isRunning(String appScopeKey) {
    return appScopeKeysToAppRecords.containsKey(appScopeKey);
  }
}
