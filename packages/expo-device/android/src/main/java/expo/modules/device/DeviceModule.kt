package expo.modules.device

import android.app.ActivityManager
import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.WindowManager
import com.facebook.device.yearclass.YearClass
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import kotlin.math.pow
import kotlin.math.sqrt

class DeviceModule : Module() {
  // Keep this enum in sync with JavaScript
  enum class DeviceType(val JSValue: Int) {
    UNKNOWN(0),
    PHONE(1),
    TABLET(2),
    DESKTOP(3),
    TV(4);
  }

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoDevice")

    Constants {
      return@Constants mapOf(
        "isDevice" to !isRunningOnEmulator,
        "brand" to Build.BRAND,
        "manufacturer" to Build.MANUFACTURER,
        "modelName" to Build.MODEL,
        "designName" to Build.DEVICE,
        "productName" to Build.DEVICE,
        "deviceYearClass" to deviceYearClass,
        "totalMemory" to run {
          val memoryInfo = ActivityManager.MemoryInfo()
          (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memoryInfo)
          memoryInfo.totalMem
        },
        "deviceType" to run {
          getDeviceType(context).JSValue
        },
        "supportedCpuArchitectures" to Build.SUPPORTED_ABIS?.takeIf { it.isNotEmpty() },
        "osName" to systemName,
        "osVersion" to Build.VERSION.RELEASE,
        "osBuildId" to Build.DISPLAY,
        "osInternalBuildId" to Build.ID,
        "osBuildFingerprint" to Build.FINGERPRINT,
        "platformApiLevel" to Build.VERSION.SDK_INT,
        "deviceName" to if (Build.VERSION.SDK_INT <= 31)
          Settings.Secure.getString(context.contentResolver, "bluetooth_name")
        else
          Settings.Global.getString(context.contentResolver, Settings.Global.DEVICE_NAME)
      )
    }

    AsyncFunction("getDeviceTypeAsync") {
      return@AsyncFunction getDeviceType(context).JSValue
    }

    AsyncFunction("getUptimeAsync") {
      return@AsyncFunction SystemClock.uptimeMillis().toDouble()
    }

    AsyncFunction("getMaxMemoryAsync") {
      val maxMemory = Runtime.getRuntime().maxMemory()
      return@AsyncFunction if (maxMemory != Long.MAX_VALUE) maxMemory.toDouble() else -1
    }

    AsyncFunction("isRootedExperimentalAsync") {
      val isRooted: Boolean
      val isDevice = !isRunningOnEmulator

      val buildTags = Build.TAGS
      isRooted = if (isDevice && buildTags != null && buildTags.contains("test-keys")) {
        true
      } else {
        if (File("/system/app/Superuser.apk").exists()) {
          true
        } else {
          isDevice && File("/system/xbin/su").exists()
        }
      }

      return@AsyncFunction isRooted
    }

    AsyncFunction("isSideLoadingEnabledAsync") {
      return@AsyncFunction if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        Settings.Global.getInt(
          context.applicationContext.contentResolver,
          Settings.Global.INSTALL_NON_MARKET_APPS,
          0
        ) == 1
      } else {
        context.applicationContext.packageManager.canRequestPackageInstalls()
      }
    }

    AsyncFunction("getPlatformFeaturesAsync") {
      val allFeatures = context.applicationContext.packageManager.systemAvailableFeatures
      return@AsyncFunction allFeatures.filterNotNull().map { it.name }
    }

    AsyncFunction("hasPlatformFeatureAsync") { feature: String ->
      return@AsyncFunction context.applicationContext.packageManager.hasSystemFeature(feature)
    }
  }

  private val deviceYearClass: Int
    get() = YearClass.get(context)

  private val systemName: String
    get() {
      return if (Build.VERSION.SDK_INT < 23) {
        "Android"
      } else {
        Build.VERSION.BASE_OS.takeIf { it.isNotEmpty() } ?: "Android"
      }
    }

  companion object {
    private val isRunningOnEmulator: Boolean
      get() = EmulatorUtilities.isRunningOnEmulator()

    private fun getDeviceType(context: Context): DeviceType {
      // Detect TVs via UI mode (Android TVs) or system features (Fire TV).
      if (context.applicationContext.packageManager.hasSystemFeature("amazon.hardware.fire_tv")) {
        return DeviceType.TV
      }

      val uiManager = context.getSystemService(Context.UI_MODE_SERVICE) as UiModeManager?
      if (uiManager != null && uiManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION) {
        return DeviceType.TV
      }

      val deviceTypeFromResourceConfiguration = getDeviceTypeFromResourceConfiguration(context)
      return if (deviceTypeFromResourceConfiguration != DeviceType.UNKNOWN) {
        deviceTypeFromResourceConfiguration
      } else {
        getDeviceTypeFromPhysicalSize(context)
      }
    }

    // Device type based on the smallest screen width quantifier
    // https://developer.android.com/guide/topics/resources/providing-resources#SmallestScreenWidthQualifier
    private fun getDeviceTypeFromResourceConfiguration(context: Context): DeviceType {
      val smallestScreenWidthDp = context.resources.configuration.smallestScreenWidthDp

      return if (smallestScreenWidthDp == Configuration.SMALLEST_SCREEN_WIDTH_DP_UNDEFINED) {
        DeviceType.UNKNOWN
      } else if (smallestScreenWidthDp >= 600) {
        DeviceType.TABLET
      } else {
        DeviceType.PHONE
      }
    }

    private fun getDeviceTypeFromPhysicalSize(context: Context): DeviceType {
      // Find the current window manager, if none is found we can't measure the device physical size.
      val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager?
        ?: return DeviceType.UNKNOWN

      // Get display metrics to see if we can differentiate phones and tablets.
      val widthInches: Double
      val heightInches: Double

      // windowManager.defaultDisplay was marked as deprecated in API level 30 (Android R) and above
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val windowBounds = windowManager.currentWindowMetrics.bounds
        val densityDpi = context.resources.configuration.densityDpi
        widthInches = windowBounds.width() / densityDpi.toDouble()
        heightInches = windowBounds.height() / densityDpi.toDouble()
      } else {
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getRealMetrics(metrics)
        widthInches = metrics.widthPixels / metrics.xdpi.toDouble()
        heightInches = metrics.heightPixels / metrics.ydpi.toDouble()
      }

      // Calculate physical size.
      val diagonalSizeInches = sqrt(widthInches.pow(2.0) + heightInches.pow(2.0))

      return if (diagonalSizeInches in 3.0..6.9) {
        // Devices in a sane range for phones are considered to be phones.
        DeviceType.PHONE
      } else if (diagonalSizeInches > 6.9 && diagonalSizeInches <= 18.0) {
        // Devices larger than a phone and in a sane range for tablets are tablets.
        DeviceType.TABLET
      } else {
        // Otherwise, we don't know what device type we're on.
        DeviceType.UNKNOWN
      }
    }
  }
}
