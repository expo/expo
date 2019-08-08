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

import com.facebook.device.yearclass.YearClass;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.io.File;
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

  // Keep this enum in sync with JavaScript
  public static enum DeviceType {
    UNKNOWN(0),
    PHONE(1),
    TABLET(2),
    DESKTOP(3),
    TV(4);
    
    private final int value;

    DeviceType(int value) {
      this.value = value;
    }

    public int getJSValue() {
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

    constants.put("isDevice", !isRunningOnGenymotion() && !isRunningOnStockEmulator());
    constants.put("brand", Build.BRAND);
    constants.put("manufacturer", Build.MANUFACTURER);
    constants.put("modelName", Build.MODEL);
    constants.put("designName", Build.DEVICE);
    constants.put("productName", Build.PRODUCT);
    constants.put("deviceYearClass", getDeviceYearClass());

    ActivityManager activityManager = (ActivityManager) mContext.getSystemService(Context.ACTIVITY_SERVICE);
    ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
    activityManager.getMemoryInfo(memoryInfo);
    constants.put("totalMemory", memoryInfo.totalMem);

    String[] supportedAbis = Build.SUPPORTED_ABIS;
    if (supportedAbis != null && supportedAbis.length == 0) {
      supportedAbis = null;
    }
    constants.put("supportedCpuArchitectures", supportedAbis);

    constants.put("osName", this.getSystemName());
    constants.put("osVersion", Build.VERSION.RELEASE);
    constants.put("osBuildId", Build.DISPLAY);
    constants.put("osInternalBuildId", Build.ID);
    constants.put("osBuildFingerprint", Build.FINGERPRINT);
    constants.put("platformApiLevel", Build.VERSION.SDK_INT);
    constants.put("deviceName", Settings.Secure.getString(mContext.getContentResolver(), "bluetooth_name"));

    return constants;
  }

  private static boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  private static boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic");
  }

  private int getDeviceYearClass() {
    return YearClass.get(mContext);
  }

  private String getSystemName() {
    String systemName;
    if (Build.VERSION.SDK_INT < 23) {
      systemName = "Android";
    } else {
      systemName = Build.VERSION.BASE_OS;
      if (systemName.length() == 0) {
        systemName = "Android";
      }
    }
    return systemName;
  }

  @ExpoMethod
  public void getDeviceTypeAsync(Promise promise) {
    DeviceType mDeviceType = DeviceModule.getDeviceType(mContext);
    promise.resolve(mDeviceType.getJSValue());
  }

  private static DeviceType getDeviceType(Context context) {
    // Detect TVs via UI mode (Android TVs) or system features (Fire TV).
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

    // Get display metrics to see if we can differentiate phones and tablets.
    DisplayMetrics metrics = new DisplayMetrics();
    windowManager.getDefaultDisplay().getMetrics(metrics);

    // Calculate physical size.
    double widthInches = metrics.widthPixels / (double) metrics.xdpi;
    double heightInches = metrics.heightPixels / (double) metrics.ydpi;
    double diagonalSizeInches = Math.sqrt(Math.pow(widthInches, 2) + Math.pow(heightInches, 2));

    if (diagonalSizeInches >= 3.0 && diagonalSizeInches <= 6.9) {
      // Devices in a sane range for phones are considered to be phones.
      return DeviceType.PHONE;
    } else if (diagonalSizeInches > 6.9 && diagonalSizeInches <= 18.0) {
      // Devices larger than a phone and in a sane range for tablets are tablets.
      return DeviceType.TABLET;
    } else {
      // Otherwise, we don't know what device type we're on.
      return DeviceType.UNKNOWN;
    }
  }

  @ExpoMethod
  public void getUptimeAsync(Promise promise) {
    Long uptime = SystemClock.uptimeMillis();
    promise.resolve(uptime.doubleValue());
  }

  @ExpoMethod
  public void getMaxMemoryAsync(Promise promise) {
    Long maxMemory = Runtime.getRuntime().maxMemory();
    if (maxMemory == Long.MAX_VALUE) {
      //convert into maximum integer that JS could fit
      promise.resolve(-1);
    } else {
      promise.resolve(maxMemory.doubleValue());
    }
  }

  @ExpoMethod
  public void isRootedExperimentalAsync(Promise promise) {
    boolean isRooted = false;
    boolean isDevice = !isRunningOnGenymotion() && !isRunningOnStockEmulator();

    try {
      String buildTags = Build.TAGS;
      if (isDevice && buildTags != null && buildTags.contains("test-keys")) {
        isRooted = true;
      } else {
        File file = new File("/system/app/Superuser.apk");
        if (file.exists()) {
          isRooted = true;
        } else {
          file = new File("/system/xbin/su");
          isRooted = isDevice && file.exists();
        }
      }
    } catch (SecurityException se) {
      promise.reject(
        "ERR_DEVICE_ROOT_DETECTION",
        "Could not access the file system to determine if the device is rooted.",
        se);
      return;
    }

    promise.resolve(isRooted);
  }

  @ExpoMethod
  public void isSideLoadingEnabledAsync(Promise promise) {
    boolean enabled;
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      enabled = Settings.Global.getInt(
        mContext.getApplicationContext().getContentResolver(),
        Settings.Global.INSTALL_NON_MARKET_APPS,
        0) == 1;
    } else {
      enabled = mContext.getApplicationContext().getPackageManager().canRequestPackageInstalls();
    }
    promise.resolve(enabled);
  }

  @ExpoMethod
  public void getPlatformFeaturesAsync(Promise promise) {
    FeatureInfo[] allFeatures = mContext.getApplicationContext().getPackageManager().getSystemAvailableFeatures();
    List<String> featureList = new ArrayList<>();
    for (int i = 0; i < allFeatures.length; i++) {
      if (allFeatures[i].name != null) {
        featureList.add(allFeatures[i].name);
      }
    }
    promise.resolve(featureList);
  }

  @ExpoMethod
  public void hasPlatformFeatureAsync(String feature, Promise promise) {
    promise.resolve(mContext.getApplicationContext().getPackageManager().hasSystemFeature(feature));
  }
}
