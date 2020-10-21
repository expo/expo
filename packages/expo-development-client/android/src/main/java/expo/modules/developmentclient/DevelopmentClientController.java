package expo.modules.developmentclient;

import android.app.Application;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.devsupport.DevInternalSettings;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.packagerconnection.PackagerConnectionSettings;

import java.lang.reflect.Field;

class DevelopmentClientPackagerConnectionSettings extends PackagerConnectionSettings {
  String mDebugServerHost;

  public DevelopmentClientPackagerConnectionSettings(Context context, String debugServerHost) {
    super(context);
    mDebugServerHost = debugServerHost;
  }

  @Override
  public String getDebugServerHost() {
    return mDebugServerHost;
  }

  @Override
  public void setDebugServerHost(String host) {
  }
}

class DevelopmentClientInternalSettings extends DevInternalSettings {
  DevelopmentClientPackagerConnectionSettings mPackagerConnectionSettings;

  public DevelopmentClientInternalSettings(Context context, String debugServerHost) {
    super(context, null);
    mPackagerConnectionSettings = new DevelopmentClientPackagerConnectionSettings(context, debugServerHost);
  }

  @Override
  public PackagerConnectionSettings getPackagerConnectionSettings() {
    return mPackagerConnectionSettings;
  }
}

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
  private ReactRootView mRootView;

  enum Mode {
    LAUNCHER,
    APP,
  };
  Mode mode = Mode.LAUNCHER;

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
    switch (mode) {
      case LAUNCHER:
        return mDevClientHost;
      case APP:
        return mAppHost;
      default:
        return null;
    }
  }

  public void setRootView(ReactRootView rootView) {
    mRootView = rootView;
  }

  void loadApp(ReactContext reactContext, String url, ReadableMap options) {
    Uri uri = Uri.parse(url);
    final String host = uri.getHost() + ":" + uri.getPort();

    // Start the app on the main thread
    new Handler(Looper.getMainLooper()).post(() -> {
      ReactInstanceManager appInstanceManager = mAppHost.getReactInstanceManager();

      try {
        DevelopmentClientInternalSettings settings = new DevelopmentClientInternalSettings(reactContext, host);

        DevSupportManager devSupportManager = appInstanceManager.getDevSupportManager();
        Class<?> devSupportManagerBaseClass = devSupportManager.getClass().getSuperclass();

        Field mDevSettingsField = devSupportManagerBaseClass.getDeclaredField("mDevSettings");
        mDevSettingsField.setAccessible(true);
        mDevSettingsField.set(devSupportManager, settings);

        Field mDevServerHelperField = devSupportManagerBaseClass.getDeclaredField("mDevServerHelper");
        mDevServerHelperField.setAccessible(true);
        Object devServerHelper = mDevServerHelperField.get(devSupportManager);
        Field mSettingsField = devServerHelper.getClass().getDeclaredField("mSettings");
        mSettingsField.setAccessible(true);
        mSettingsField.set(devServerHelper, settings);

        mode = Mode.APP;
        mRootView.unmountReactApplication();
        mRootView.startReactApplication(appInstanceManager, mMainComponentName);
        appInstanceManager.onHostResume(reactContext.getCurrentActivity());
      } catch (Exception e) {
        Log.e("ExpoDevelopmentClient", "Couldn't inject settings.", e);
        mode = Mode.LAUNCHER;
      }
    });
  }

  void navigateToLauncher() {
    // TODO(nikki): Implement this...
  }
}
