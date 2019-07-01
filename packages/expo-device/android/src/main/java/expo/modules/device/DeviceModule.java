package expo.modules.device;

import android.app.Activity;
import android.content.Context;
import android.content.pm.FeatureInfo;
import android.content.pm.PackageManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.util.Log;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.app.KeyguardManager;
import android.os.StatFs;
import android.telephony.TelephonyManager;
import android.app.ActivityManager;
import android.app.UiModeManager;
import android.view.WindowManager;
import android.util.DisplayMetrics;
import android.content.res.Configuration;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.math.BigInteger;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DeviceModule extends ExportedModule implements RegistryLifecycleListener{
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


  private WifiInfo getWifiInfo() {
    try {
      WifiManager manager = (WifiManager) mContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
      return manager.getConnectionInfo();
    } catch (NullPointerException e) {
      Log.e(TAG, e.getMessage());
      throw e;
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
    constants.put("model", Build.MODEL);
    constants.put("systemName", this.getSystemName());
    constants.put("uniqueId", Settings.Secure.getString(mContext.getContentResolver(), Settings.Secure.ANDROID_ID));
    constants.put("supportedABIs", Build.SUPPORTED_ABIS);

    ActivityManager actMgr = (ActivityManager) mContext.getSystemService(Context.ACTIVITY_SERVICE);
    ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
    actMgr.getMemoryInfo(memInfo);
    constants.put("totalMemory", memInfo.totalMem);

    DeviceType mDeviceType = getDeviceType(mContext);
    constants.put("deviceType", mDeviceType.getValue());
    constants.put("isTablet", mDeviceType.getValue().equals("Tablet"));

    return constants;
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
  public void getFreeDiskStorageAsync(Promise promise) {
    try {
      StatFs external = new StatFs(Environment.getExternalStorageDirectory().getAbsolutePath());
      long availableBlocks = external.getAvailableBlocksLong();
      long blockSize = external.getBlockSizeLong();

      BigInteger storage = BigInteger.valueOf(availableBlocks).multiply(BigInteger.valueOf(blockSize));
      promise.resolve(storage.doubleValue());
    } catch (NullPointerException e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_DEVICE", "No available free disk storage.");
    }
  }

  @ExpoMethod
  public void getIpAddressAsync(Promise promise) {
    try {
      Integer ipAddress = getWifiInfo().getIpAddress();
      // Convert little-endian to big-endianif needed
      if (ByteOrder.nativeOrder().equals(ByteOrder.LITTLE_ENDIAN)) {
        ipAddress = Integer.reverseBytes(ipAddress);
      }
      byte[] ipByteArray = BigInteger.valueOf(ipAddress).toByteArray();
      String ipAddressString = InetAddress.getByAddress(ipByteArray).getHostAddress();
      promise.resolve(ipAddressString);
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_DEVICE", "Unknown Host Exception");
    }
  }

  @ExpoMethod
  public void getMACAddressAsync(String interfaceName, Promise promise) {
    String permission = "android.permission.INTERNET";
    int res = mContext.checkCallingOrSelfPermission(permission);

    String macAddress = "";
    if (res == PackageManager.PERMISSION_GRANTED) {
      try {
        List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
        for (NetworkInterface intf : interfaces) {
          if (interfaceName != null) {
            if (!intf.getName().equalsIgnoreCase(interfaceName)) continue;
          }
          byte[] mac = intf.getHardwareAddress();
          if (mac == null) {
            macAddress = null;
          }
          StringBuilder buf = new StringBuilder();
          for (byte aMac : mac) {
            buf.append(String.format("%02X:", aMac));
          }
          if (buf.length() > 0) {
            buf.deleteCharAt(buf.length() - 1);
          }
          macAddress = buf.toString();
          promise.resolve(macAddress);
          break;
        }
        //catch undefined network interface name
        promise.reject("ERR_DEVICE", "Undefined interface name");
      } catch (Exception e) {
        Log.e(TAG, e.getMessage());
        promise.reject("ERR_DEVICE", "Socket exception");
      }
    } else {
      promise.reject("ERR_DEVICE", "No permission granted to access the Internet");
    }
  }

  @ExpoMethod
  public void isAirplaneModeEnabledAsync(Promise promise) {
    boolean isAirPlaneMode = Settings.Global.getInt(mContext.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) != 0;
    promise.resolve(isAirPlaneMode);
  }

  @ExpoMethod
  public void hasSystemFeatureAsync(String feature, Promise promise) {
    promise.resolve(mContext.getApplicationContext().getPackageManager().hasSystemFeature(feature));
  }

  @ExpoMethod
  public void hasLocalAuthenticationAsync(Promise promise) {
    KeyguardManager keyguardManager = (KeyguardManager) mContext.getApplicationContext().getSystemService(Context.KEYGUARD_SERVICE); //api 16+
    promise.resolve(keyguardManager.isKeyguardSecure());
  }

  @ExpoMethod
  public void getUserAgentAsync(Promise promise) {
    String userAgent = System.getProperty("http.agent");
    promise.resolve(userAgent);
  }

  @ExpoMethod
  public void getCarrierAsync(Promise promise) {
    try {
      TelephonyManager telMgr = (TelephonyManager) mContext.getSystemService(Context.TELEPHONY_SERVICE);
      promise.resolve(telMgr.getNetworkOperatorName());
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_DEVICE", "Null pointer exception");
    }
  }

  @ExpoMethod
  public void getTotalDiskCapacityAsync(Promise promise) {
    try {
      StatFs root = new StatFs(Environment.getRootDirectory().getAbsolutePath());
      BigInteger capacity = BigInteger.valueOf(root.getBlockCountLong()).multiply(BigInteger.valueOf(root.getBlockSizeLong()));
      promise.resolve(capacity.doubleValue());
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_DEVICE", "Unable to access total disk capacity");
    }
  }

  @ExpoMethod
  public void getSystemAvailableFeaturesAsync(Promise promise) {
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
