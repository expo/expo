package expo.modules.network;

import java.math.BigInteger;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.ByteOrder;
import java.security.AccessControlException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import android.content.Context;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.provider.Settings;
import android.util.Log;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

public class NetworkModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoNetwork";
  private static final String TAG = NetworkModule.class.getSimpleName();
  private Context mContext;
  private ModuleRegistry mModuleRegistry;
  private ActivityProvider mActivityProvider;
  private Activity mActivity;

  public NetworkModule(Context context) {
    super(context);
    mContext = context;
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

  private WifiInfo getWifiInfo() {
    try {
      WifiManager manager = (WifiManager) mContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
      return manager.getConnectionInfo();
    } catch (NullPointerException e) {
      Log.e(TAG, e.getMessage());
      throw e;
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
      promise.reject("ERR_NETWORK_UNKNOWN_HOST", "Unknown Host Exception", e);
    }
  }

  @ExpoMethod
  public void getMacAddressAsync(String interfaceName, Promise promise) {
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
            macAddress = "";
          }
          StringBuilder buf = new StringBuilder();
          for (byte aMac : mac) {
            buf.append(String.format("%02X:", aMac));
          }
          if (buf.length() > 0) {
            buf.deleteCharAt(buf.length() - 1);
          }
          macAddress = buf.toString();
          if (!macAddress.isEmpty()) {
            promise.resolve(macAddress);
          }
          break;
        }
        if (macAddress.isEmpty()) {
          //catch undefined network interface name
          promise.reject("ERR_NETWORK_UNDEFINED_INTERFACE", "Undefined interface name");
        }
      } catch (Exception e) {
        Log.e(TAG, e.getMessage());
        promise.reject("ERR_NETWORK_SOCKET_EXCEPTION", "Error in creating or accessing the socket", e);
      }
    } else {
      promise.reject("ERR_NETWORK_INVALID_PERMISSION_INTERNET", "No permission granted to access the Internet");
    }
  }

  @ExpoMethod
  public void isAirplaneModeEnableAsync(Promise promise) {
    boolean isAirPlaneMode = Settings.Global.getInt(mContext.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) != 0;
    promise.resolve(isAirPlaneMode);
  }
}
