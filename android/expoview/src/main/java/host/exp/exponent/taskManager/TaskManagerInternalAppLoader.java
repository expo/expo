package host.exp.exponent.taskManager;

import android.content.Context;
import android.util.Log;

import org.unimodules.core.interfaces.Consumer;

import expo.loaders.provider.interfaces.AppLoader;

import java.util.HashMap;
import java.util.Map;

import expo.loaders.provider.AppLoaderProvider;
import host.exp.exponent.headless.HeadlessAppLoader;

public class TaskManagerInternalAppLoader implements AppLoader {

  private static final String TAG = "TaskManagerInternalAppL";

  private static AppLoaderInterface appLoader;

  private final HashMap<String, AppRecordInterface> appIdsToAppRecords = new HashMap<>();

  public TaskManagerInternalAppLoader(Context context) {}

  @Override
  public void loadApp(Context context, Params params, Runnable alreadyRunning, Consumer<Boolean> callback) throws IllegalArgumentException, IllegalStateException {

    AppLoaderInterface appLoader = createAppLoader(context);

    if (appLoader == null) {
      throw new IllegalStateException("Cannot execute background task because application loader can't be found.");
    } else if (params.getAppUrl() == null) {
      throw new IllegalArgumentException("Cannot execute background task because application URL is invalid");
    } else {

      if (appIdsToAppRecords.containsKey(params.getAppId())) {
        alreadyRunning.run();
      } else {
        Map<String, Object> options = new HashMap<>();

        Log.i(TAG, "Loading headless app '" + params.getAppId() + "' with url '" + params.getAppUrl() + "'.");

        AppRecordInterface appRecord = appLoader.loadApp(params.getAppUrl(), options, new AppLoaderProvider.Callback() {
          @Override
          public void onComplete(boolean success, Exception exception) {
            if (exception != null) {
              exception.printStackTrace();
              Log.e(TAG, exception.getMessage());
            }
            callback.apply(success);
            if (!success) {
              appIdsToAppRecords.remove(params.getAppId());
            }
          }
        });

        appIdsToAppRecords.put(params.getAppId(), appRecord);
      }
    }
  }

  @Override
  public boolean invalidateApp(String appId) {
    return false;
  }

  private AppLoaderInterface createAppLoader(Context context) {
    // for now only react-native apps in Expo are supported
    if(appLoader == null) {
      appLoader = new HeadlessAppLoader(context);
    }
    return appLoader;
  }

}
