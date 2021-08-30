package expo.modules.apploader;

import android.content.Context;
import android.content.pm.PackageManager;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

public class AppLoaderProvider {

  private static Map<String, HeadlessAppLoader> loaders = new HashMap<>();

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

  @SuppressWarnings("unchecked")
  private static void createLoader(String name, Context context) throws ClassNotFoundException, IllegalAccessException, InstantiationException, java.lang.reflect.InvocationTargetException, NoSuchMethodException {
    Class<? extends HeadlessAppLoader> loaderClass;
    try {
      String loaderClassName = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA).metaData.getString("org.unimodules.core.AppLoader#" + name);
      if (loaderClassName != null) {
        loaderClass = (Class<? extends HeadlessAppLoader>)Class.forName(loaderClassName);
        loaders.put(name, (HeadlessAppLoader) loaderClass.getDeclaredConstructor(Context.class).newInstance(context));
      } else {
        throw new IllegalStateException("Unable to instantiate AppLoader!");
      }
    } catch (PackageManager.NameNotFoundException e) {
      throw new IllegalStateException("Unable to instantiate AppLoader!", e);
    }

  }

  public static abstract class Callback {

    public void onComplete(boolean success, Exception exception) {
      // nothing
    }
  }
}
