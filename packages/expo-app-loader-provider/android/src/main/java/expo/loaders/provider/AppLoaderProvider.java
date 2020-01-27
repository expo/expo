package expo.loaders.provider;

import android.content.Context;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

import expo.loaders.provider.interfaces.HeadlessAppLoader;

public class AppLoaderProvider {

  private static final String APP_LOADER_PREFERENCES_NAME = "appLoader_config";
  private static final String KEY_LOADER_PREFIX = "appLoader_";

  private static Map<String, Class> loaderClasses = new HashMap<>();
  private static Map<String, HeadlessAppLoader> loaders = new HashMap<>();

  public static void registerLoader(Context context, String name, Class loaderClass) {
    context.getSharedPreferences(APP_LOADER_PREFERENCES_NAME, Context.MODE_PRIVATE).edit()
      .putString(KEY_LOADER_PREFIX + name, loaderClass.getName())
      .apply();
    loaderClasses.put(name, loaderClass);
  }

  public static HeadlessAppLoader getLoader(String name, Context context) {
    if (!loaders.containsKey(name)) {
      try {
        createLoader(name, context);
      } catch (Exception e) {
        Log.e("Expo", "Cannot initialize app loader. " + e.getMessage());
        return null;
      }
    }
    return loaders.get(name);
  }

  private static void createLoader(String name, Context context) throws ClassNotFoundException, IllegalAccessException, InstantiationException, java.lang.reflect.InvocationTargetException, NoSuchMethodException {
    Class loaderClass = loaderClasses.get(name);
    if (loaderClass == null) {
      String loaderClassName = context.getSharedPreferences(APP_LOADER_PREFERENCES_NAME, Context.MODE_PRIVATE)
        .getString(KEY_LOADER_PREFIX + name, null);
      if (loaderClassName != null) {
        loaderClass = Class.forName(loaderClassName);
      }
    }
    loaders.put(name, (HeadlessAppLoader) loaderClass.getDeclaredConstructor(Context.class).newInstance(context));
  }

  public static abstract class Callback {
    public void onComplete(boolean success, Exception exception) {
      // nothing
    }
  }
}
