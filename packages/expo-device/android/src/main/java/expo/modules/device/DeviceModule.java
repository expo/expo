package expo.modules.device;

import android.app.Activity;
import android.content.Context;
import android.content.pm.FeatureInfo;
import android.os.Build;
import android.provider.Settings;
import android.app.ActivityManager;
import android.app.UiModeManager;
import android.view.WindowManager;
import android.util.DisplayMetrics;
import android.content.res.Configuration;
import android.os.SystemClock;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Runtime;

public class DeviceModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoDevice";
  private static final String TAG = DeviceModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;
  private Context mContext;
  private ActivityProvider mActivityProvider;
  private Activity mActivity;

  public DeviceModule(Context context) {
    super(context);
    mContext = context;
  }

  public enum DeviceType {
    HANDSET("Handset"),
    TABLET("Tablet"),
    TV("Tv"),
    UNKNOWN("Unknown");

    private final String value;

    DeviceType(String value) {
      this.value = value;
    }

    public String getValue() {
      return value;
    }
  }


  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mActivity = mActivityProvider.getCurrentActivity();
  }

  @Override
  public Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();

    constants.put("brand", Build.BRAND);
    constants.put("manufacturer", Build.MANUFACTURER);
    constants.put("modelName", Build.MODEL);
    constants.put("osName", this.getSystemName());
    constants.put("supportedCPUArchitectures", Build.SUPPORTED_ABIS);
    constants.put("designName", Build.DEVICE);
    constants.put("systemBuildId", Build.DISPLAY);
    constants.put("productName", Build.PRODUCT);
    constants.put("platformApiLevel", Build.VERSION.SDK_INT);
    constants.put("osVersion", Build.VERSION.RELEASE);
    constants.put("deviceName", Settings.Secure.getString(mContext.getContentResolver(), "bluetooth_name"));
    constants.put("osBuildFingerprint", Build.FINGERPRINT);
    constants.put("osBuildId", Build.ID);

    ActivityManager actMgr = (ActivityManager) mContext.getSystemService(Context.ACTIVITY_SERVICE);
    ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
    actMgr.getMemoryInfo(memInfo);
    constants.put("totalMemory", memInfo.totalMem);

    DeviceType mDeviceType = getDeviceType(mContext);
    constants.put("deviceType", mDeviceType.getValue());
    constants.put("isDevice", !isRunningOnGenymotion() && !isRunningOnStockEmulator());

    return constants;
  }

  private static boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  private static boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic");
  }

  private String getSystemName() {
    String systemName = "";
    if (android.os.Build.VERSION.SDK_INT < 23) {
      systemName = "Android";
    } else {
      systemName = Build.VERSION.BASE_OS;
      if (systemName.length() == 0) {
        systemName = "Android";
      }
    }
    return systemName;
  }

  private static DeviceType getDeviceType(Context context) {
    // Detect TVs via ui mode (Android TVs) or system features (Fire TV).
    if (context.getApplicationContext().getPackageManager().hasSystemFeature("amazon.hardware.fire_tv")) {
      return DeviceType.TV;
    }

    UiModeManager uiManager = (UiModeManager) context.getSystemService(Context.UI_MODE_SERVICE);
    if (uiManager != null && uiManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
      return DeviceType.TV;
    }

    // Find the current window manager, if none is found we can't measure the device physical size.
    WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    if (windowManager == null) {
      return DeviceType.UNKNOWN;
    }

    // Get display metrics to see if we can differentiate handsets and tablets.
    // NOTE: for API level 16 the metrics will exclude window decor.
    DisplayMetrics metrics = new DisplayMetrics();
    windowManager.getDefaultDisplay().getMetrics(metrics);

    // Calculate physical size.
    double widthInches = metrics.widthPixels / (double) metrics.xdpi;
    double heightInches = metrics.heightPixels / (double) metrics.ydpi;
    double diagonalSizeInches = Math.sqrt(Math.pow(widthInches, 2) + Math.pow(heightInches, 2));

    if (diagonalSizeInches >= 3.0 && diagonalSizeInches <= 6.9) {
      // Devices in a sane range for phones are considered to be Handsets.
      return DeviceType.HANDSET;
    } else if (diagonalSizeInches > 6.9 && diagonalSizeInches <= 18.0) {
      // Devices larger than handset and in a sane range for tablets are tablets.
      return DeviceType.TABLET;
    } else {
      // Otherwise, we don't know what device type we're on/
      return DeviceType.UNKNOWN;
    }
  }

  @ExpoMethod
  public void hasPlatformFeatureAsync(String feature, Promise promise) {
    promise.resolve(mContext.getApplicationContext().getPackageManager().hasSystemFeature(feature));
  }

  @ExpoMethod
  public void getMaxMemoryAsync(Promise promise) {
    Long maxMemory = Runtime.getRuntime().maxMemory();
    promise.resolve(maxMemory.doubleValue());
  }

  @ExpoMethod
  public void isSideLoadingEnabled(Promise promise) {
    boolean enabled;
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      if(Settings.Global.getInt(null, Settings.Global.INSTALL_NON_MARKET_APPS, 0) == 1){
       enabled =  true;
      }
      else{
        enabled = false;
      }
    } else {
      enabled = mContext.getApplicationContext().getPackageManager().canRequestPackageInstalls();
    }
    promise.resolve(enabled);
  }

  @ExpoMethod
  public void getUptimeAsync(Promise promise) {
    Long uptime = SystemClock.uptimeMillis();
    promise.resolve(uptime.doubleValue());
  }

  @ExpoMethod
  public void getPlatformFeaturesAsync(Promise promise) {
    FeatureInfo[] allFeatures = mContext.getApplicationContext().getPackageManager().getSystemAvailableFeatures();
    List<String> featureString = new ArrayList<>();
    for (int i = 0; i < allFeatures.length; i++) {
      if (allFeatures[i].name != null) {
        featureString.add(allFeatures[i].name);
      }
    }
    promise.resolve(featureString);
  }
}
