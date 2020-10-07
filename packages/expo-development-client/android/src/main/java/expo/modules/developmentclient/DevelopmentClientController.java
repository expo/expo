package expo.modules.developmentclient;

import android.app.Application;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;

public class DevelopmentClientController {
  // Use this to load from a development server for the development client launcher UI
//  private final String DEV_LAUNCHER_HOST = "10.0.0.175:8090";
  private final String DEV_LAUNCHER_HOST = null;

  // Host to which network requests always fails, forcing React Native to use our embedded bundle
//  private final String FAKE_HOST = "127.0.0.1:1234";

  // Must be in sync with value in `DevSupportManagerImpl` from React Native internals
//  private static final String JS_BUNDLE_FILE_NAME = "ReactNativeDevBundle.js";

  // Singleton instance
  private static DevelopmentClientController sInstance;

  private String mMainComponentName;
  private DevelopmentClientHost mDevClientHost;
  private ReactNativeHost mAppHost;

  private DevelopmentClientController(Context context, ReactNativeHost appHost, String mainComponentName) {
    mMainComponentName = mainComponentName;
    mAppHost = appHost;
    mDevClientHost = new DevelopmentClientHost((Application) context);
  }

  public static DevelopmentClientController getInstance() {
    if (sInstance == null) {
      throw new IllegalStateException("DevelopmentClientController.getInstance() was called before the module was initialized");
    }
    return sInstance;
  }

  public static void initialize(Context context, ReactNativeHost appHost, String mainComponentName) {
    if (sInstance == null) {
      sInstance = new DevelopmentClientController(context, appHost, mainComponentName);
    }
  }

  public static void initialize(Context context, ReactNativeHost appHost) {
    initialize(context, appHost, "main");
  }

  String getMainComponentName() {
    return mMainComponentName;
  }

  public ReactNativeHost getReactNativeHost() {
    return mDevClientHost;
  }

  void loadApp(ReactContext reactContext, String url, ReadableMap options) {
    Uri uri = Uri.parse(url);

    // Read orientation config
    final int orientation =
        options.hasKey("orientation") && options.getString("orientation").equals("landscape") ?
            ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE :
            ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;

    // Start the app on the main thread
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        // TODO(nikki): Implement this...
        mDevClientHost.getReactInstanceManager().destroy();
        mAppHost.getReactInstanceManager().createReactContextInBackground();
      }
    });
  }

  void navigateToLauncher() {
    // TODO(nikki): Implement this...
  }
}
