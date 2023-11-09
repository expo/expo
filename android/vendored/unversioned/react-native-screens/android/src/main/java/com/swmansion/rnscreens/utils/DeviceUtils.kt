package com.swmansion.rnscreens.utils

import android.content.Context
import android.content.pm.PackageManager

object DeviceUtils {

    fun isPlatformAndroidTV(context: Context?): Boolean {
        return context?.packageManager?.hasSystemFeature(PackageManager.FEATURE_LEANBACK) == true
    }

}
