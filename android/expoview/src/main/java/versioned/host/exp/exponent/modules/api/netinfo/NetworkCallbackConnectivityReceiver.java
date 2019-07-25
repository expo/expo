/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * <p>
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package versioned.host.exp.exponent.modules.api.netinfo;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;

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

      // If we currently have no active network, we are not going to get a callback below, so
      // we
      // should manually send a "none" event
      if (getConnectivityManager().getActiveNetwork() == null) {
        updateAndSend();
      }
    } catch (SecurityException e) {
      setNoNetworkPermission();
    }
  }

  @Override
  void unregister() {
    try {
      getConnectivityManager().unregisterNetworkCallback(mNetworkCallback);
    } catch (SecurityException e) {
      setNoNetworkPermission();
    } catch (IllegalArgumentException e) {
      // ignore this, it is expected when the callback was not registered successfully
    }
  }

  @SuppressLint("MissingPermission")
  private void updateAndSend() {
    String connectionType = CONNECTION_TYPE_OTHER;
    String cellularGeneration = null;

    if (mNetworkCapabilities != null) {
      if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) {
        connectionType = CONNECTION_TYPE_BLUETOOTH;
      } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
        connectionType = CONNECTION_TYPE_CELLULAR;

        if (mNetwork != null) {
          NetworkInfo networkInfo = getConnectivityManager().getNetworkInfo(mNetwork);
          cellularGeneration = getEffectiveConnectionType(networkInfo);
        }
      } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
        connectionType = CONNECTION_TYPE_ETHERNET;
      } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
        connectionType = CONNECTION_TYPE_WIFI;
      } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
        connectionType = CONNECTION_TYPE_VPN;
      }
    } else {
      connectionType = CONNECTION_TYPE_NONE;
    }

    updateConnectivity(connectionType, cellularGeneration);
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
