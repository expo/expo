package abi42_0_0.expo.modules.network;

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

import abi42_0_0.org.unimodules.core.ExportedModule;
import abi42_0_0.org.unimodules.core.ModuleRegistry;
import abi42_0_0.org.unimodules.core.Promise;
import abi42_0_0.org.unimodules.core.interfaces.ActivityProvider;
import abi42_0_0.org.unimodules.core.interfaces.ExpoMethod;
import abi42_0_0.org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.math.BigInteger;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.UnknownHostException;
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
      return manager.getConnectionInfo();
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

  private NetworkStateType getConnectionType(NetworkCapabilities nc) {
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) return NetworkStateType.CELLULAR;
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI_AWARE))
      return NetworkStateType.WIFI;
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) return NetworkStateType.BLUETOOTH;
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return NetworkStateType.ETHERNET;
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) return NetworkStateType.VPN;
    return NetworkStateType.UNKNOWN;
  }

  private String rawIpToString(Integer ip) {
    // Convert little-endian to big-endian if needed
    if (ByteOrder.nativeOrder().equals(ByteOrder.LITTLE_ENDIAN)) {
      ip = Integer.reverseBytes(ip);
    }
    byte[] ipByteArray = BigInteger.valueOf(ip).toByteArray();
    if (ipByteArray.length < 4) {
      ipByteArray = frontPadWithZeros(ipByteArray);
    }
    try {
      return InetAddress.getByAddress(ipByteArray).getHostAddress();
    } catch (UnknownHostException e) {
      return "0.0.0.0";
    }
  }

  private static byte[] frontPadWithZeros(byte [] inputArray) {
    byte[] newByteArray = { 0, 0, 0, 0 };
    System.arraycopy(inputArray, 0, newByteArray, 4 - inputArray.length, inputArray.length);
    return newByteArray;
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
        NetworkStateType connectionType = null;
        if (isInternetReachable) {
          NetworkCapabilities nc = cm.getNetworkCapabilities(network);
          connectionType = getConnectionType(nc);
          result.putString("type", connectionType.getValue());
        } else {
          result.putString("type", NetworkStateType.NONE.getValue());
        }
        result.putBoolean("isInternetReachable", isInternetReachable);
        result.putBoolean("isConnected", connectionType != null && !connectionType.equal("NONE") && !connectionType.equal("UNKNOWN"));
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
      String ipAddressString = rawIpToString(ipAddress);
      promise.resolve(ipAddressString);
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_NETWORK_IP_ADDRESS", "Unknown Host Exception", e);
    }
  }

  @ExpoMethod
  public void isAirplaneModeEnabledAsync(Promise promise) {
    boolean isAirPlaneMode = Settings.Global.getInt(mContext.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) != 0;
    promise.resolve(isAirPlaneMode);
  }
}
