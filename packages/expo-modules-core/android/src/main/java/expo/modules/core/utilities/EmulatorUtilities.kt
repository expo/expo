package expo.modules.core.utilities

import android.os.Build
import java.util.*

object EmulatorUtilities {
  fun isRunningOnEmulator(): Boolean {
    return Build.FINGERPRINT.startsWith("generic") ||
      Build.FINGERPRINT.startsWith("unknown") ||
      Build.MODEL.contains("google_sdk") ||
      Build.MODEL.lowercase(Locale.ROOT).contains("droid4x") ||
      Build.MODEL.contains("Emulator") ||
      Build.MODEL.contains("Android SDK built for x86") ||
      Build.MANUFACTURER.contains("Genymotion") ||
      Build.HARDWARE.contains("goldfish") ||
      Build.HARDWARE.contains("ranchu") ||
      Build.HARDWARE.contains("vbox86") ||
      Build.PRODUCT.contains("sdk") ||
      Build.PRODUCT.contains("google_sdk") ||
      Build.PRODUCT.contains("sdk_google") ||
      Build.PRODUCT.contains("sdk_x86") ||
      Build.PRODUCT.contains("vbox86p") ||
      Build.PRODUCT.contains("emulator") ||
      Build.PRODUCT.contains("simulator") ||
      Build.BOARD.lowercase(Locale.ROOT).contains("nox") ||
      Build.BOOTLOADER.lowercase(Locale.ROOT).contains("nox") ||
      Build.HARDWARE.lowercase(Locale.ROOT).contains("nox") ||
      Build.PRODUCT.lowercase(Locale.ROOT).contains("nox") ||
      Build.SERIAL.lowercase(Locale.ROOT).contains("nox") ||
      (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
  }
}
