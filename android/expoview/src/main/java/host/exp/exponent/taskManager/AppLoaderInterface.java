package host.exp.exponent.taskManager;

import org.unimodules.apploader.AppLoaderProvider;

import java.util.Map;

public interface AppLoaderInterface {
  AppRecordInterface loadApp(String appUrl, Map<String, Object> options, AppLoaderProvider.Callback callback);
}
