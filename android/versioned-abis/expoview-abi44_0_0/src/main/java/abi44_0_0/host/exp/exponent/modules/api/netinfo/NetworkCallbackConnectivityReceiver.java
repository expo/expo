/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi44_0_0.host.exp.exponent.modules.api.netinfo;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.NetworkRequest;
import android.os.Build;

import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi44_0_0.host.exp.exponent.modules.api.netinfo.types.CellularGeneration;
import abi44_0_0.host.exp.exponent.modules.api.netinfo.types.ConnectionType;

/**
 * This gets the connectivity status using a NetworkCallback on the system default network. This
 * method was added into Android from API level 24 (N) and we use it for all devices which support
 * it.
 */
@TargetApi(Build.VERSION_CODES.N)
public class NetworkCallbackConnectivityReceiver extends ConnectivityReceiver {
    private final ConnectivityNetworkCallback mNetworkCallback;

    public NetworkCallbackConnectivityReceiver(ReactApplicationContext reactContext) {
        super(reactContext);
        mNetworkCallback = new ConnectivityNetworkCallback();
    }

    @Override
    @SuppressLint("MissingPermission")
    public void register() {
        try {
            NetworkRequest.Builder builder = new NetworkRequest.Builder();
            getConnectivityManager().registerNetworkCallback(builder.build(), mNetworkCallback);
        } catch (SecurityException e) {
            // TODO: Display a yellow box about this
        }
    }

    @Override
    public void unregister() {
        try {
            getConnectivityManager().unregisterNetworkCallback(mNetworkCallback);
        } catch (SecurityException e) {
            // TODO: Display a yellow box about this
        } catch (IllegalArgumentException e) {
            // ignore this, it is expected when the callback was not registered successfully
        }
    }

    @SuppressLint("MissingPermission")
    void updateAndSend() {
        Network network = getConnectivityManager().getActiveNetwork();
        NetworkCapabilities capabilities = getConnectivityManager().getNetworkCapabilities(network);
        ConnectionType connectionType = ConnectionType.UNKNOWN;
        CellularGeneration cellularGeneration = null;
        NetworkInfo networkInfo = null;
        boolean isInternetReachable = false;
        boolean isInternetSuspended = false;

        if (capabilities != null) {
            // Get the connection type
            if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) {
                connectionType = ConnectionType.BLUETOOTH;
            } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                connectionType = ConnectionType.CELLULAR;
            } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                connectionType = ConnectionType.ETHERNET;
            } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                connectionType = ConnectionType.WIFI;
            } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
                connectionType = ConnectionType.VPN;
            }

            if (network != null) {
                // This may return null per API docs, and is deprecated, but for older APIs (< VERSION_CODES.P)
                // we need it to test for suspended internet
                networkInfo = getConnectivityManager().getNetworkInfo(network);
            }

            // Check to see if the network is temporarily unavailable or if airplane mode is toggled on
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                isInternetSuspended = !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_SUSPENDED);
            } else {
                if (network != null && networkInfo != null) {
                    NetworkInfo.DetailedState detailedConnectionState = networkInfo.getDetailedState();
                    if (!detailedConnectionState.equals(NetworkInfo.DetailedState.CONNECTED)) {
                        isInternetSuspended = true;
                    }
                }
            }

            isInternetReachable =
                    capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                            && capabilities.hasCapability(
                            NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                            && !isInternetSuspended;

            // Get the cellular network type
            if (network != null && connectionType == ConnectionType.CELLULAR && isInternetReachable) {
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
            updateAndSend();
        }

        @Override
        public void onLosing(Network network, int maxMsToLive) {
            updateAndSend();
        }

        @Override
        public void onLost(Network network) {
            updateAndSend();
        }

        @Override
        public void onUnavailable() {
            updateAndSend();
        }

        @Override
        public void onCapabilitiesChanged(
                Network network, NetworkCapabilities networkCapabilities) {
            updateAndSend();
        }

        @Override
        public void onLinkPropertiesChanged(Network network, LinkProperties linkProperties) {
            updateAndSend();
        }
    }
}
