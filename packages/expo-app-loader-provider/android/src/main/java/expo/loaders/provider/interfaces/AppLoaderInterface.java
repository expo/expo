package expo.loaders.provider.interfaces;

import java.util.Map;

import expo.loaders.provider.AppLoaderProvider;

public interface AppLoaderInterface {
  AppRecordInterface loadApp(String appUrl, Map<String, Object> options, AppLoaderProvider.Callback callback);
}
