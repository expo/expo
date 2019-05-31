package expo.modules.camera2.utils

import android.content.Context
import android.hardware.camera2.CameraManager

fun Context.getCameraManager() = (getSystemService(Context.CAMERA_SERVICE) as CameraManager)