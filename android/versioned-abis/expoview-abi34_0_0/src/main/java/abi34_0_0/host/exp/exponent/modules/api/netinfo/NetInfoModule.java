/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * <p>
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi34_0_0.host.exp.exponent.modules.api.netinfo;

import android.os.Build;

import abi34_0_0.com.facebook.react.bridge.Promise;
import abi34_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi34_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi34_0_0.com.facebook.react.bridge.ReactMethod;

/** Module that monitors and provides information about the connectivity state of the device. */
public class NetInfoModule extends ReactContextBaseJavaModule {
  public static final String NAME = "RNCNetInfo";

  private final ConnectivityReceiver mConnectivityReceiver;

  public NetInfoModule(ReactApplicationContext reactContext) {
    super(reactContext);
    // Create the connectivity receiver based on the API level we are running on
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      mConnectivityReceiver = new NetworkCallbackConnectivityReceiver(reactContext);
    } else {
      mConnectivityReceiver = new BroadcastReceiverConnectivityReceiver(reactContext);
    }
  }

  @Override
  public void initialize() {
    mConnectivityReceiver.register();
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mConnectivityReceiver.unregister();
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void getCurrentState(Promise promise) {
    mConnectivityReceiver.getCurrentState(promise);
  }
}
