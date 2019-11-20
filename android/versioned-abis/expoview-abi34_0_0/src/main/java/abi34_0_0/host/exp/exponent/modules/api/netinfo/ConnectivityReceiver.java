/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * <p>
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi34_0_0.host.exp.exponent.modules.api.netinfo;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import androidx.core.net.ConnectivityManagerCompat;
import android.telephony.TelephonyManager;

import abi34_0_0.com.facebook.react.bridge.Promise;
import abi34_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi34_0_0.com.facebook.react.bridge.WritableMap;
import abi34_0_0.com.facebook.react.bridge.WritableNativeMap;
import abi34_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

abstract class ConnectivityReceiver {
  // Based on the ConnectionType enum described in the W3C Network Information API spec
  // (https://wicg.github.io/netinfo/).
  static final String CONNECTION_TYPE_BLUETOOTH = "bluetooth";
  static final String CONNECTION_TYPE_CELLULAR = "cellular";
  static final String CONNECTION_TYPE_ETHERNET = "ethernet";
  static final String CONNECTION_TYPE_NONE = "none";
  static final String CONNECTION_TYPE_UNKNOWN = "unknown";
  static final String CONNECTION_TYPE_WIFI = "wifi";
  static final String CONNECTION_TYPE_WIMAX = "wimax";
  static final String CONNECTION_TYPE_VPN = "vpn";
  static final String CONNECTION_TYPE_OTHER = "other";

  // Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
  // (https://wicg.github.io/netinfo/).
  static final String CELLULAR_GENERATION_2G = "2g";
  static final String CELLULAR_GENERATION_3G = "3g";
  static final String CELLULAR_GENERATION_4G = "4g";

  static final String MISSING_PERMISSION_MESSAGE =
      "To use NetInfo on Android, add the following to your AndroidManifest.xml:\n"
          + "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\" />";

  static final String ERROR_MISSING_PERMISSION = "E_MISSING_PERMISSION";

  private final ConnectivityManager mConnectivityManager;
  private final ReactApplicationContext mReactContext;

  private boolean mNoNetworkPermission = false;
  private String mConnectionType = CONNECTION_TYPE_UNKNOWN;
  private String mCellularGeneration = null;

  ConnectivityReceiver(ReactApplicationContext reactContext) {
    mReactContext = reactContext;
    mConnectivityManager =
        (ConnectivityManager) reactContext.getSystemService(Context.CONNECTIVITY_SERVICE);
  }

  abstract void register();

  abstract void unregister();

  public void getCurrentState(Promise promise) {
    if (mNoNetworkPermission) {
      promise.reject(ERROR_MISSING_PERMISSION, MISSING_PERMISSION_MESSAGE);
      return;
    }
    promise.resolve(createConnectivityEventMap());
  }

  public ReactApplicationContext getReactContext() {
    return mReactContext;
  }

  public ConnectivityManager getConnectivityManager() {
    return mConnectivityManager;
  }

  public void setNoNetworkPermission() {
    mNoNetworkPermission = true;
  }

  String getEffectiveConnectionType(NetworkInfo networkInfo) {
    if (networkInfo == null) {
      return null;
    }

    switch (networkInfo.getSubtype()) {
      case TelephonyManager.NETWORK_TYPE_1xRTT:
      case TelephonyManager.NETWORK_TYPE_CDMA:
      case TelephonyManager.NETWORK_TYPE_EDGE:
      case TelephonyManager.NETWORK_TYPE_GPRS:
      case TelephonyManager.NETWORK_TYPE_IDEN:
        return CELLULAR_GENERATION_2G;
      case TelephonyManager.NETWORK_TYPE_EHRPD:
      case TelephonyManager.NETWORK_TYPE_EVDO_0:
      case TelephonyManager.NETWORK_TYPE_EVDO_A:
      case TelephonyManager.NETWORK_TYPE_EVDO_B:
      case TelephonyManager.NETWORK_TYPE_HSDPA:
      case TelephonyManager.NETWORK_TYPE_HSPA:
      case TelephonyManager.NETWORK_TYPE_HSUPA:
      case TelephonyManager.NETWORK_TYPE_UMTS:
        return CELLULAR_GENERATION_3G;
      case TelephonyManager.NETWORK_TYPE_HSPAP:
      case TelephonyManager.NETWORK_TYPE_LTE:
        return CELLULAR_GENERATION_4G;
      case TelephonyManager.NETWORK_TYPE_UNKNOWN:
      default:
        return null;
    }
  }

  void updateConnectivity(String connectionType, String cellularGeneration) {
    // It is possible to get multiple broadcasts for the same connectivity change, so we only
    // update and send an event when the connectivity has indeed changed.
    boolean connectionTypeChanged =
        (connectionType == null && mConnectionType != null)
            || (connectionType != null
            && !connectionType.equalsIgnoreCase(mConnectionType));
    boolean cellularGenerationChanged =
        (cellularGeneration == null && mCellularGeneration != null)
            || (cellularGeneration != null
            && !cellularGeneration.equalsIgnoreCase(mCellularGeneration));
    if (connectionTypeChanged || cellularGenerationChanged) {
      mConnectionType = connectionType;
      mCellularGeneration = cellularGeneration;
      sendConnectivityChangedEvent();
    }
  }

  private void sendConnectivityChangedEvent() {
    getReactContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("netInfo.networkStatusDidChange", createConnectivityEventMap());
  }

  private WritableMap createConnectivityEventMap() {
    WritableMap event = new WritableNativeMap();

    // Add the connection type information
    event.putString("type", mConnectionType);

    // Add the connection state information
    boolean isConnected =
        !mConnectionType.equals(CONNECTION_TYPE_NONE)
            && !mConnectionType.equals(CONNECTION_TYPE_UNKNOWN);
    event.putBoolean("isConnected", isConnected);

    // Add the details, if there are any
    WritableMap details = null;
    if (isConnected) {
      details = new WritableNativeMap();

      boolean isConnectionExpensive =
          ConnectivityManagerCompat.isActiveNetworkMetered(getConnectivityManager());
      details.putBoolean("isConnectionExpensive", isConnectionExpensive);

      if (mConnectionType.equals(CONNECTION_TYPE_CELLULAR)) {
        details.putString("cellularGeneration", mCellularGeneration);
      }
    }
    event.putMap("details", details);

    return event;
  }
}
