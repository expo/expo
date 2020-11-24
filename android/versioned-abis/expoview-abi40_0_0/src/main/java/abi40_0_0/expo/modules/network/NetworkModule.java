package abi40_0_0.expo.modules.network;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;

import abi40_0_0.org.unimodules.core.ExportedModule;
import abi40_0_0.org.unimodules.core.ModuleRegistry;
import abi40_0_0.org.unimodules.core.Promise;
import abi40_0_0.org.unimodules.core.interfaces.ActivityProvider;
import abi40_0_0.org.unimodules.core.interfaces.ExpoMethod;
import abi40_0_0.org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.math.BigInteger;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.ByteOrder;
import java.util.Collections;
import java.util.List;

public class NetworkModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoNetwork";
  private static final String TAG = NetworkModule.class.getSimpleName();
  private Context mContext;
  private ModuleRegistry mModuleRegistry;
  private ActivityProvider mActivityProvider;
  private Activity mActivity;

  public static enum NetworkStateType {
    NONE("NONE"),
    UNKNOWN("UNKNOWN"),
    CELLULAR("CELLULAR"),
    WIFI("WIFI"),
    BLUETOOTH("BLUETOOTH"),
    ETHERNET("ETHERNET"),
    WIMAX("WIMAX"),
    VPN("VPN"),
    OTHER("OTHER");

    private final String value;

    NetworkStateType(String value) {
      this.value = value;
    }

    public String getValue() {
      return value;
    }

    public boolean equal(String value) {
      return this.value.equals(value);
    }
  }

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
      WifiInfo wifiInfo = manager.getConnectionInfo();
      return wifiInfo;
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      throw e;
    }
  }

  private NetworkStateType getConnectionType(NetworkInfo netinfo) {
    switch (netinfo.getType()) {
      case ConnectivityManager.TYPE_MOBILE:
      case ConnectivityManager.TYPE_MOBILE_DUN:
        return NetworkStateType.CELLULAR;
      case ConnectivityManager.TYPE_WIFI:
        return NetworkStateType.WIFI;
      case ConnectivityManager.TYPE_BLUETOOTH:
        return NetworkStateType.BLUETOOTH;
      case ConnectivityManager.TYPE_ETHERNET:
        return NetworkStateType.ETHERNET;
      case ConnectivityManager.TYPE_WIMAX:
        return NetworkStateType.WIMAX;
      case ConnectivityManager.TYPE_VPN:
        return NetworkStateType.VPN;
      default:
        return NetworkStateType.UNKNOWN;
    }
  }

  private NetworkStateType getNetworkCapabilities(NetworkCapabilities nc) {
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) return NetworkStateType.CELLULAR;
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI_AWARE))
      return NetworkStateType.WIFI;
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) return NetworkStateType.BLUETOOTH;
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return NetworkStateType.ETHERNET;
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) return NetworkStateType.VPN;
    return NetworkStateType.UNKNOWN;
  }

  @ExpoMethod
  public void getNetworkStateAsync(Promise promise) {
    Bundle result = new Bundle();
    ConnectivityManager cm = (ConnectivityManager) mContext.getSystemService(Context.CONNECTIVITY_SERVICE);
    //use getActiveNetworkInfo before api level 29
    if (Build.VERSION.SDK_INT < 29) {
      try {
        NetworkInfo netInfo = cm.getActiveNetworkInfo();
        result.putBoolean("isInternetReachable", netInfo.isConnected());
        NetworkStateType mConnectionType = getConnectionType(netInfo);
        result.putString("type", mConnectionType.getValue());
        result.putBoolean("isConnected", !mConnectionType.equal("NONE") && !mConnectionType.equal("UNKNOWN"));
        promise.resolve(result);
      } catch (Exception e) {
        promise.reject("ERR_NETWORK_NO_ACCESS_NETWORKINFO", "Unable to access network information", e);
      }
    } else {
      try {
        Network network = cm.getActiveNetwork();
        boolean isInternetReachable = network != null;
        NetworkStateType mConnectionType = null;
        if (isInternetReachable) {
          NetworkCapabilities nc = cm.getNetworkCapabilities(network);
          mConnectionType = getNetworkCapabilities(nc);
          result.putString("type", mConnectionType.getValue());
        } else {
          result.putString("type", NetworkStateType.NONE.getValue());
        }
        result.putBoolean("isInternetReachable", isInternetReachable);
        result.putBoolean("isConnected", mConnectionType != null && !mConnectionType.equal("NONE") && !mConnectionType.equal("UNKNOWN"));
        promise.resolve(result);
      } catch (Exception e) {
        promise.reject("ERR_NETWORK_NO_ACCESS_NETWORKINFO", "Unable to access network information", e);
      }
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
      promise.reject("ERR_NETWORK_IP_ADDRESS", "Unknown Host Exception", e);
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
          if (mac != null) {
            for (byte aMac : mac) {
              buf.append(String.format("%02X:", aMac));
            }
          }
          if (buf.length() > 0) {
            buf.deleteCharAt(buf.length() - 1);
          }
          macAddress = buf.toString();
          if (!macAddress.isEmpty()) {
            promise.resolve(macAddress);
            break;
          }
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
  public void isAirplaneModeEnabledAsync(Promise promise) {
    boolean isAirPlaneMode = Settings.Global.getInt(mContext.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) != 0;
    promise.resolve(isAirPlaneMode);
  }
}
