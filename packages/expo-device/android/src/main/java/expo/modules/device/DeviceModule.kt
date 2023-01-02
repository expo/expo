package expo.modules.device

import android.app.ActivityManager
import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.graphics.Rect
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

private const val NAME = "ExpoDevice"
// Devices with a size higher than 600dp are considered tablets.
private const val MIN_TABLET_SIZE_DP = 600

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
        "supportedCpuArchitectures" to Build.SUPPORTED_ABIS?.takeIf { it.isNotEmpty() },
        "osName" to systemName,
        "osVersion" to Build.VERSION.RELEASE,
        "osBuildId" to Build.DISPLAY,
        "osInternalBuildId" to Build.ID,
        "osBuildFingerprint" to Build.FINGERPRINT,
        "platformApiLevel" to Build.VERSION.SDK_INT,
        "deviceType" to getDeviceType(context).JSValue,
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
    private val TAG = DeviceModule::class.java.simpleName

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

      // Find the current window manager, if none is found we can't measure the device physical size.
      val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager?
        ?: return DeviceType.UNKNOWN

      // Get display metrics to see if we can differentiate phones and tablets.
      val bounds: Rect = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        windowManager.maximumWindowMetrics.bounds
      } else {
        val metrics = DisplayMetrics()
        windowManager.defaultDisplay.getRealMetrics(metrics)

        Rect(0, 0, metrics.widthPixels, metrics.heightPixels)
      }

      val smallestWidth: Float = dpiFromPx(
        bounds.width().coerceAtMost(bounds.height()),
        context.resources.configuration.densityDpi
      )

      return if (smallestWidth < MIN_TABLET_SIZE_DP) {
        // Devices in a sane range for phones are considered to be phones.
        DeviceType.PHONE
      } else {
        // Devices larger than MIN_TABLET_SIZE_DP are considered tablets
        DeviceType.TABLET
      }
    }

    private fun dpiFromPx(size: Int, densityDpi: Int): Float {
      val densityRatio = densityDpi.toFloat() / DisplayMetrics.DENSITY_DEFAULT
      return size / densityRatio
    }
  }
}
