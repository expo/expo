package expo.modules.developmentclient;

import android.app.Application;
import android.content.Context;
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

  // Singleton instance
  private static DevelopmentClientController sInstance;

  private Context mContext;
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
    mContext = context;
    mMainComponentName = mainComponentName;
    mAppHost = appHost;
    mDevClientHost = new DevelopmentClientHost((Application) context, DEV_LAUNCHER_HOST != null);
    if (DEV_LAUNCHER_HOST != null) {
      injectDebugServerHost(mDevClientHost, DEV_LAUNCHER_HOST);
    }
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
    String debugServerHost = uri.getHost() + ":" + uri.getPort();
    if (injectDebugServerHost(mAppHost, debugServerHost)) {
      mode = Mode.APP;
      startReactInstance(reactContext, mAppHost);
    }
  }

  void navigateToLauncher(ReactContext reactContext) {
    mode = Mode.LAUNCHER;
    startReactInstance(reactContext, mDevClientHost);
  }

  boolean injectDebugServerHost(ReactNativeHost reactNativeHost, String debugServerHost) {
    try {
      ReactInstanceManager instanceManager = reactNativeHost.getReactInstanceManager();

      DevelopmentClientInternalSettings settings = new DevelopmentClientInternalSettings(mContext, debugServerHost);

      DevSupportManager devSupportManager = instanceManager.getDevSupportManager();
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
      return true;
    } catch (Exception e) {
      Log.e("ExpoDevelopmentClient", "Unable to inject debug server host settings.", e);
      return false;
    }
  }

  void startReactInstance(ReactContext reactContext, ReactNativeHost reactNativeHost) {
    new Handler(Looper.getMainLooper()).post(() -> {
      ReactInstanceManager instanceManager = reactNativeHost.getReactInstanceManager();
      mRootView.unmountReactApplication();
      mRootView.startReactApplication(instanceManager, mMainComponentName);
      instanceManager.onHostResume(reactContext.getCurrentActivity());
    });
  }
}
