/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi48_0_0.host.exp.exponent.modules.api.netinfo;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi48_0_0.host.exp.exponent.modules.api.netinfo.types.CellularGeneration;
import abi48_0_0.host.exp.exponent.modules.api.netinfo.types.ConnectionType;

/**
 * This gets the connectivity status using a BroadcastReceiver. This method was deprecated on
 * Android from API level 24 (N) but we use this method still for any devices running below level
 * 24.
 *
 * <p>It has a few differences from the new NetworkCallback method: - Changes to the cellular
 * network effective type (eg. from 2g to 3g) will not trigger a callback
 */
@SuppressWarnings("deprecation")
public class BroadcastReceiverConnectivityReceiver extends ConnectivityReceiver {
    private final ConnectivityBroadcastReceiver mConnectivityBroadcastReceiver;
    public static final String CONNECTIVITY_ACTION = "android.net.conn.CONNECTIVITY_CHANGE";

    public BroadcastReceiverConnectivityReceiver(ReactApplicationContext reactContext) {
        super(reactContext);
        mConnectivityBroadcastReceiver = new ConnectivityBroadcastReceiver();
    }

    @Override
    public void register() {
        IntentFilter filter = new IntentFilter();
        filter.addAction(CONNECTIVITY_ACTION);
        getReactContext().registerReceiver(mConnectivityBroadcastReceiver, filter);
        mConnectivityBroadcastReceiver.setRegistered(true);
        updateAndSendConnectionType();
    }

    @Override
    public void unregister() {
        if (mConnectivityBroadcastReceiver.isRegistered()) {
            getReactContext().unregisterReceiver(mConnectivityBroadcastReceiver);
            mConnectivityBroadcastReceiver.setRegistered(false);
        }
    }

    @SuppressLint("MissingPermission")
    private void updateAndSendConnectionType() {
        ConnectionType connectionType = ConnectionType.UNKNOWN;
        CellularGeneration cellularGeneration = null;
        boolean isInternetReachable = false;

        try {
            NetworkInfo networkInfo = getConnectivityManager().getActiveNetworkInfo();
            if (networkInfo == null || !networkInfo.isConnected()) {
                connectionType = ConnectionType.NONE;
            } else {
                // Check if the internet is reachable
                isInternetReachable = networkInfo.isConnected();

                // Get the connection type
                int networkType = networkInfo.getType();
                switch (networkType) {
                    case ConnectivityManager.TYPE_BLUETOOTH:
                        connectionType = ConnectionType.BLUETOOTH;
                        break;
                    case ConnectivityManager.TYPE_ETHERNET:
                        connectionType = ConnectionType.ETHERNET;
                        break;
                    case ConnectivityManager.TYPE_MOBILE:
                    case ConnectivityManager.TYPE_MOBILE_DUN:
                        connectionType = ConnectionType.CELLULAR;
                        cellularGeneration = CellularGeneration.fromNetworkInfo(networkInfo);
                        break;
                    case ConnectivityManager.TYPE_WIFI:
                        connectionType = ConnectionType.WIFI;
                        break;
                    case ConnectivityManager.TYPE_WIMAX:
                        connectionType = ConnectionType.WIMAX;
                        break;
                    case ConnectivityManager.TYPE_VPN:
                        connectionType = ConnectionType.VPN;
                        break;
                }
            }
        } catch (SecurityException e) {
            connectionType = ConnectionType.UNKNOWN;
        }

        updateConnectivity(connectionType, cellularGeneration, isInternetReachable);
    }

    /**
     * Class that receives intents whenever the connection type changes. NB: It is possible on some
     * devices to receive certain connection type changes multiple times.
     */
    private class ConnectivityBroadcastReceiver extends BroadcastReceiver {

        // TODO: Remove registered check when source of crash is found. t9846865
        private boolean isRegistered = false;

        public void setRegistered(boolean registered) {
            isRegistered = registered;
        }

        public boolean isRegistered() {
            return isRegistered;
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (action != null && action.equals(CONNECTIVITY_ACTION)) {
                updateAndSendConnectionType();
            }
        }
    }
}
