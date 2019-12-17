package expo.modules.taskManager.apploader;

import android.content.Context;

import java.util.Map;

import expo.loaders.provider.AppLoaderProvider;
import expo.loaders.provider.interfaces.AppLoaderInterface;
import expo.loaders.provider.interfaces.AppRecordInterface;

public class HeadlessAppLoader implements AppLoaderInterface {

  private Context mContext;

  public HeadlessAppLoader(Context context) {
    this.mContext = context;
  }

  @Override
  public AppRecordInterface loadApp(String appUrl, Map<String, Object> options, AppLoaderProvider.Callback callback) {
    HeadlessAppRecord appRecord = new HeadlessAppRecord();

    ReactInstanceManager reactInstanceManager = new ReactInstanceManager();

    return appRecord;
  }
}
