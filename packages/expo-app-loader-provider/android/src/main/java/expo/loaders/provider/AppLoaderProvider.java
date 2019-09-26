package expo.loaders.provider;

import android.content.Context;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

import expo.loaders.provider.interfaces.AppLoaderInterface;

public class AppLoaderProvider {
  private static Map<String, Class> loaderClasses = new HashMap<>();

  public static void registerLoader(String name, Class loaderClass) {
    loaderClasses.put(name, loaderClass);
  }

  public static AppLoaderInterface createLoader(String name, Context context) {
    try {
      Class loaderClass = loaderClasses.get(name);
      return (AppLoaderInterface) loaderClass.getDeclaredConstructor(Context.class).newInstance(context);
    } catch (Exception e) {
      Log.e("Expo", "Cannot initialize app loader. " + e.getMessage());
      return null;
    }
  }

  public static abstract class Callback {
    public void onComplete(boolean success, Exception exception) {
      // nothing
    }
  }
}
