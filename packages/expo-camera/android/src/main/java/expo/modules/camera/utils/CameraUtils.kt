package expo.modules.camera.utils

import android.content.Context
import android.content.pm.PackageManager

object CameraUtils {
  private const val GOOGLE_PLAY_STORE_PACKAGE = "com.android.vending"

  fun hasGooglePlayServices(context: Context?): Boolean {
    if (context == null) {
      return false
    }
    return try {
      context.packageManager
        .getPackageInfo(GOOGLE_PLAY_STORE_PACKAGE, 0)
      true
    } catch (_: PackageManager.NameNotFoundException) {
      false
    }
  }

  fun isMLKitBarcodeScannerAvailable(): Boolean {
    return try {
      Class.forName("com.google.mlkit.vision.barcode.BarcodeScanning")
      true
    } catch (_: ClassNotFoundException) {
      false
    }
  }

  fun isMLKitAvailable(context: Context?): Boolean {
    if (!hasGooglePlayServices(context)) {
      return false
    }

    return isMLKitBarcodeScannerAvailable()
  }
}
