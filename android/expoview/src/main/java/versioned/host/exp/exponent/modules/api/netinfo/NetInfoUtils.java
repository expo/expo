/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package versioned.host.exp.exponent.modules.api.netinfo;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

public class NetInfoUtils {
    public static void reverseByteArray(byte[] array) {
        for (int i = 0; i < array.length / 2; i++) {
            byte temp = array[i];
            array[i] = array[array.length - i - 1];
            array[array.length - i - 1] = temp;
        }
    }

    public static boolean isAccessWifiStatePermissionGranted(Context context) {
        return ContextCompat.checkSelfPermission(context,
                Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED;
    }


    /**
     * Starting with Android 14, apps and services that target Android 14 and use context-registered
     * receivers are required to specify a flag to indicate whether or not the receiver should be
     * exported to all other apps on the device: either RECEIVER_EXPORTED or RECEIVER_NOT_EXPORTED
     * <a href="https://developer.android.com/about/versions/14/behavior-changes-14#runtime-receivers-exported"/>
     */
    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    public static void compatRegisterReceiver(
            Context context, BroadcastReceiver receiver, IntentFilter filter, boolean exported) {
        if (Build.VERSION.SDK_INT >= 34 && context.getApplicationInfo().targetSdkVersion >= 34) {
            context.registerReceiver(
                    receiver, filter, exported ? Context.RECEIVER_EXPORTED : Context.RECEIVER_NOT_EXPORTED);
        } else {
            context.registerReceiver(receiver, filter);
        }
    }
}
