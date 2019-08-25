package expo.modules.constants;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.DisplayMetrics;
import android.util.Log;

import com.facebook.device.yearclass.YearClass;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.interfaces.constants.ConstantsInterface;

public class ConstantsService implements InternalModule, ConstantsInterface {
  private static final String TAG = ConstantsService.class.getSimpleName();

  protected Context mContext;
  protected int mStatusBarHeight = 0;
  private String mSessionId = UUID.randomUUID().toString();

  private static int convertPixelsToDp(float px, Context context) {
    Resources resources = context.getResources();
    DisplayMetrics metrics = resources.getDisplayMetrics();
    float dp = px / (metrics.densityDpi / 160f);
    return (int) dp;
  }

  public ConstantsService(Context context) {
    super();
    mContext = context;

    int resourceId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");

    if (resourceId > 0) {
      int statusBarHeightPixels = context.getResources().getDimensionPixelSize(resourceId);
      // Convert from pixels to dip
      mStatusBarHeight = convertPixelsToDp(statusBarHeightPixels, context);
    }
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) ConstantsInterface.class);
  }

  @Nullable
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();

    constants.put("sessionId", mSessionId);
    constants.put("statusBarHeight", getStatusBarHeight());
    constants.put("deviceYearClass", getDeviceYearClass());
    constants.put("deviceName", getDeviceName());
    constants.put("isDevice", getIsDevice());
    constants.put("systemFonts", getSystemFonts());
    constants.put("systemVersion", getSystemVersion());

    PackageManager packageManager = mContext.getPackageManager();
    try {
      PackageInfo pInfo = packageManager.getPackageInfo(mContext.getPackageName(), 0);
      constants.put("nativeAppVersion", pInfo.versionName);

      int versionCode = (int)getLongVersionCode(pInfo);
      constants.put("nativeBuildVersion", Integer.toString(versionCode));
    } catch (PackageManager.NameNotFoundException e) {
      Log.e(TAG, "Exception: ", e);
    }

    Map<String, Object> platform = new HashMap<>();
    Map<String, Object> androidPlatform = new HashMap<>();

    platform.put("android", androidPlatform);
    constants.put("platform", platform);
    return constants;
  }

  public String getAppId() {
    // Just use package name in vanilla React Native apps.
    return mContext.getPackageName();
  }

  public String getAppOwnership() {
    return "guest";
  }

  public String getDeviceName() {
    return Build.MODEL;
  }

  public int getDeviceYearClass() {
    return YearClass.get(mContext);
  }

  public boolean getIsDevice() {
    return !isRunningOnGenymotion() && !isRunningOnStockEmulator();
  }

  public int getStatusBarHeight() {
    return mStatusBarHeight;
  }

  public String getSystemVersion() {
    return Build.VERSION.RELEASE;
  }

  public List<String> getSystemFonts() {
    // From https://github.com/dabit3/react-native-fonts
    List<String> result = new ArrayList<>();
    result.add("normal");
    result.add("notoserif");
    result.add("sans-serif");
    result.add("sans-serif-light");
    result.add("sans-serif-thin");
    result.add("sans-serif-condensed");
    result.add("sans-serif-medium");
    result.add("serif");
    result.add("Roboto");
    result.add("monospace");
    return result;
  }

  private static boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  private static boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic");
  }

  private static long getLongVersionCode(PackageInfo info) {
    if (Build.VERSION.SDK_INT >= 28) {
      return info.getLongVersionCode();
    }
    return info.versionCode;
  }
}
