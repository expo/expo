/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi49_0_0.host.exp.exponent.modules.api.netinfo;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;

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
}
