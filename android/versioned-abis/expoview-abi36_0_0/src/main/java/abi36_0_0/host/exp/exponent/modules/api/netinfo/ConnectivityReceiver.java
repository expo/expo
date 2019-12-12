/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi36_0_0.host.exp.exponent.modules.api.netinfo;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.telephony.TelephonyManager;
import androidx.core.net.ConnectivityManagerCompat;
import abi36_0_0.com.facebook.react.bridge.Promise;
import abi36_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi36_0_0.com.facebook.react.bridge.WritableMap;
import abi36_0_0.com.facebook.react.bridge.WritableNativeMap;
import abi36_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import abi36_0_0.host.exp.exponent.modules.api.netinfo.types.CellularGeneration;
import abi36_0_0.host.exp.exponent.modules.api.netinfo.types.ConnectionType;
import java.math.BigInteger;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

abstract class ConnectivityReceiver {

    private final ConnectivityManager mConnectivityManager;
    private final WifiManager mWifiManager;
    private final TelephonyManager mTelephonyManager;
    private final ReactApplicationContext mReactContext;

    @Nonnull private ConnectionType mConnectionType = ConnectionType.UNKNOWN;
    @Nullable private CellularGeneration mCellularGeneration = null;
    private boolean mIsInternetReachable = false;

    ConnectivityReceiver(ReactApplicationContext reactContext) {
        mReactContext = reactContext;
        mConnectivityManager =
                (ConnectivityManager) reactContext.getSystemService(Context.CONNECTIVITY_SERVICE);
        mWifiManager =
                (WifiManager)
                        reactContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        mTelephonyManager =
                (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);
    }

    abstract void register();

    abstract void unregister();

    public void getCurrentState(Promise promise) {
        promise.resolve(createConnectivityEventMap());
    }

    ReactApplicationContext getReactContext() {
        return mReactContext;
    }

    ConnectivityManager getConnectivityManager() {
        return mConnectivityManager;
    }

    void updateConnectivity(
            @Nonnull ConnectionType connectionType,
            @Nullable CellularGeneration cellularGeneration,
            boolean isInternetReachable) {
        // It is possible to get multiple broadcasts for the same connectivity change, so we only
        // update and send an event when the connectivity has indeed changed.
        boolean connectionTypeChanged = connectionType != mConnectionType;
        boolean cellularGenerationChanged = cellularGeneration != mCellularGeneration;
        boolean isInternetReachableChanged = isInternetReachable != mIsInternetReachable;

        if (connectionTypeChanged || cellularGenerationChanged || isInternetReachableChanged) {
            mConnectionType = connectionType;
            mCellularGeneration = cellularGeneration;
            mIsInternetReachable = isInternetReachable;
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
        event.putString("type", mConnectionType.label);

        // Add the connection state information
        boolean isConnected =
                !mConnectionType.equals(ConnectionType.NONE)
                        && !mConnectionType.equals(ConnectionType.UNKNOWN);
        event.putBoolean("isConnected", isConnected);

        // Add the internet reachable information
        event.putBoolean("isInternetReachable", mIsInternetReachable);

        // Add the details, if there are any
        WritableMap details = null;
        if (isConnected) {
            details = new WritableNativeMap();

            boolean isConnectionExpensive =
                    ConnectivityManagerCompat.isActiveNetworkMetered(getConnectivityManager());
            details.putBoolean("isConnectionExpensive", isConnectionExpensive);

            if (mConnectionType.equals(ConnectionType.CELLULAR)) {
                // Add the cellular generation, if we have one
                if (mCellularGeneration != null) {
                    details.putString("cellularGeneration", mCellularGeneration.label);
                }

                // Add the network operator name, if there is one
                String carrier = mTelephonyManager.getNetworkOperatorName();
                if (carrier != null) {
                    details.putString("carrier", carrier);
                }
            } else if (mConnectionType.equals(ConnectionType.WIFI)) {
                WifiInfo wifiInfo = mWifiManager.getConnectionInfo();

                if (wifiInfo != null) {
                    // Get the SSID
                    try {
                        String initialSSID = wifiInfo.getSSID();
                        if (initialSSID != null && !initialSSID.contains("<unknown ssid>")) {
                            // Strip the quotes, if any
                            String ssid = initialSSID.replace("\"", "");
                            details.putString("ssid", ssid);
                        }
                    } catch (Exception e) {
                        // Ignore errors
                    }

                    // Get/parse the wifi signal strength
                    try {
                        int signalStrength =
                                WifiManager.calculateSignalLevel(wifiInfo.getRssi(), 100);
                        details.putInt("strength", signalStrength);
                    } catch (Exception e) {
                        // Ignore errors
                    }

                    // Get the IP address
                    try {
                        byte[] ipAddressByteArray =
                                BigInteger.valueOf(wifiInfo.getIpAddress()).toByteArray();
                        NetInfoUtils.reverseByteArray(ipAddressByteArray);
                        InetAddress inetAddress = InetAddress.getByAddress(ipAddressByteArray);
                        String ipAddress = inetAddress.getHostAddress();
                        details.putString("ipAddress", ipAddress);
                    } catch (Exception e) {
                        // Ignore errors
                    }

                    // Get the subnet mask
                    try {
                        byte[] ipAddressByteArray =
                                BigInteger.valueOf(wifiInfo.getIpAddress()).toByteArray();
                        NetInfoUtils.reverseByteArray(ipAddressByteArray);
                        InetAddress inetAddress = InetAddress.getByAddress(ipAddressByteArray);
                        NetworkInterface netAddress = NetworkInterface.getByInetAddress(inetAddress);
                        int mask = 0xffffffff << (32 - netAddress.getInterfaceAddresses().get(1).getNetworkPrefixLength());
                        String subnet = String.format("%d.%d.%d.%d", (mask >> 24 & 0xff), (mask >> 16 & 0xff), (mask >> 8 & 0xff), (mask & 0xff));
                        details.putString("subnet", subnet);
                    } catch (Exception e) {
                        // Ignore errors
                    }
                }
            }
        }
        event.putMap("details", details);

        return event;
    }
}
