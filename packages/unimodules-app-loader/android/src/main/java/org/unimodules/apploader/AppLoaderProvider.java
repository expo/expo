package org.unimodules.apploader;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

public class AppLoaderProvider {

  private static Map<String, Class> loaderClasses = new HashMap<>();
  private static Map<String, HeadlessAppLoader> loaders = new HashMap<>();

  public static void registerLoader(Context context, String name, Class loaderClass) {
    registerLoader(context, name, loaderClass, false);
  }

  public static void registerLoader(Context context, String name, Class loaderClass, boolean overload) {
    if (!overload) {
      if (appLoaderRegisteredForName(context, name)) return;
    }
    getSharedPreferences(context).edit()
      .putString(appLoaderKey(name), loaderClass.getName())
      .apply();
    loaderClasses.put(name, loaderClass);
  }

  public static HeadlessAppLoader getLoader(String name, Context context) {
    if (!loaders.containsKey(name)) {
      try {
        createLoader(name, context);
      } catch (Exception e) {
        Log.e("Expo", "Cannot initialize app loader. " + e.getMessage());
        e.printStackTrace();
        return null;
      }
    }
    return loaders.get(name);
  }

  private static boolean appLoaderRegisteredForName(Context context, String name) {
    return loaderClasses.containsKey(name) || getSharedPreferences(context).getString(appLoaderKey(name), null) != null;
  }

  private static void createLoader(String name, Context context) throws ClassNotFoundException, IllegalAccessException, InstantiationException, java.lang.reflect.InvocationTargetException, NoSuchMethodException {
    Class loaderClass = loaderClasses.get(name);
    if (loaderClass == null) {
      String loaderClassName = getSharedPreferences(context)
        .getString(appLoaderKey(name), null);
      if (loaderClassName != null) {
        loaderClass = Class.forName(loaderClassName);
      }
    }
    loaders.put(name, (HeadlessAppLoader) loaderClass.getDeclaredConstructor(Context.class).newInstance(context));
  }

  private static final String APP_LOADER_PREFERENCES_NAME = "appLoader_config";
  private static final String KEY_LOADER_PREFIX = "appLoader_";

  private static String appLoaderKey(String appLoaderName) {
    return KEY_LOADER_PREFIX + appLoaderName;
  }

  private static SharedPreferences getSharedPreferences(Context context) {
    return context.getSharedPreferences(APP_LOADER_PREFERENCES_NAME, Context.MODE_PRIVATE);
  }

  public static abstract class Callback {

    public void onComplete(boolean success, Exception exception) {
      // nothing
    }
  }
}
