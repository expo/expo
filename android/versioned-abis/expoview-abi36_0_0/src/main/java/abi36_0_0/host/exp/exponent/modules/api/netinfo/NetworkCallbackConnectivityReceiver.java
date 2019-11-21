/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi36_0_0.host.exp.exponent.modules.api.netinfo;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.Build;
import abi36_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi36_0_0.host.exp.exponent.modules.api.netinfo.types.CellularGeneration;
import abi36_0_0.host.exp.exponent.modules.api.netinfo.types.ConnectionType;

/**
 * This gets the connectivity status using a NetworkCallback on the system default network. This
 * method was added into Android from API level 24 (N) and we use it for all devices which support
 * it.
 */
@TargetApi(Build.VERSION_CODES.N)
class NetworkCallbackConnectivityReceiver extends ConnectivityReceiver {
    private final ConnectivityNetworkCallback mNetworkCallback;
    private Network mNetwork = null;
    private NetworkCapabilities mNetworkCapabilities = null;

    public NetworkCallbackConnectivityReceiver(ReactApplicationContext reactContext) {
        super(reactContext);
        mNetworkCallback = new ConnectivityNetworkCallback();
    }

    @Override
    @SuppressLint("MissingPermission")
    void register() {
        try {
            getConnectivityManager().registerDefaultNetworkCallback(mNetworkCallback);
        } catch (SecurityException e) {
            // TODO: Display a yellow box about this
        }
    }

    @Override
    void unregister() {
        try {
            getConnectivityManager().unregisterNetworkCallback(mNetworkCallback);
        } catch (SecurityException e) {
            // TODO: Display a yellow box about this
        } catch (IllegalArgumentException e) {
            // ignore this, it is expected when the callback was not registered successfully
        }
    }

    @SuppressLint("MissingPermission")
    private void updateAndSend() {
        ConnectionType connectionType = ConnectionType.UNKNOWN;
        CellularGeneration cellularGeneration = null;
        boolean isInternetReachable = false;

        if (mNetworkCapabilities != null) {
            // Get the connection type
            if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) {
                connectionType = ConnectionType.BLUETOOTH;
            } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                connectionType = ConnectionType.CELLULAR;
            } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                connectionType = ConnectionType.ETHERNET;
            } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                connectionType = ConnectionType.WIFI;
            } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
                connectionType = ConnectionType.VPN;
            }

            isInternetReachable =
                    mNetworkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                            && mNetworkCapabilities.hasCapability(
                                    NetworkCapabilities.NET_CAPABILITY_VALIDATED);

            // Get the cellular network type
            if (mNetwork != null && connectionType == ConnectionType.CELLULAR) {
                NetworkInfo networkInfo = getConnectivityManager().getNetworkInfo(mNetwork);
                cellularGeneration = CellularGeneration.fromNetworkInfo(networkInfo);
            }
        } else {
            connectionType = ConnectionType.NONE;
        }

        updateConnectivity(connectionType, cellularGeneration, isInternetReachable);
    }

    private class ConnectivityNetworkCallback extends ConnectivityManager.NetworkCallback {
        @Override
        public void onAvailable(Network network) {
            mNetwork = network;
            mNetworkCapabilities = getConnectivityManager().getNetworkCapabilities(network);
            updateAndSend();
        }

        @Override
        public void onLosing(Network network, int maxMsToLive) {
            mNetwork = network;
            mNetworkCapabilities = getConnectivityManager().getNetworkCapabilities(network);
            updateAndSend();
        }

        @Override
        public void onLost(Network network) {
            mNetwork = null;
            mNetworkCapabilities = null;
            updateAndSend();
        }

        @Override
        public void onUnavailable() {
            mNetwork = null;
            mNetworkCapabilities = null;
            updateAndSend();
        }

        @Override
        public void onCapabilitiesChanged(
                Network network, NetworkCapabilities networkCapabilities) {
            mNetwork = network;
            mNetworkCapabilities = networkCapabilities;
            updateAndSend();
        }

        @Override
        public void onLinkPropertiesChanged(Network network, LinkProperties linkProperties) {
            mNetwork = network;
            mNetworkCapabilities = getConnectivityManager().getNetworkCapabilities(network);
            updateAndSend();
        }
    }
}
