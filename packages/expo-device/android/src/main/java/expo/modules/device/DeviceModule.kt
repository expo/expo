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
import io.github.expo.modules.v2.Constant
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.async.Promise
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.math.pow
import kotlin.math.sqrt

@ExpoModule("ExpoDevice")
class DeviceModule : Module() {
  @JS
  @Constant
  val isDevice: Boolean
    get() = !isRunningOnEmulator

  @JS
  @Constant
  val brand: String
    get() = Build.BRAND

  @JS
  @Constant
  val manufacturer: String
    get() = Build.MANUFACTURER

  @JS
  @Constant
  val modelName: String
    get() = Build.MODEL

  @JS
  @Constant
  val designName: String
    get() = Build.DEVICE

  @JS
  @Constant
  val productName: String
    get() = Build.PRODUCT

  @JS
  @Constant
  val deviceYearClass: Int
    get() = YearClass.get(androidContext)

  @JS
  @Constant
  val totalMemory: Long
    get() {
      val memoryInfo = ActivityManager.MemoryInfo()
      (androidContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memoryInfo)
      return memoryInfo.totalMem
    }

  @JS
  @Constant
  val deviceType: DeviceType
    get() = getDeviceType(androidContext)

  @JS
  @Constant
  val supportedCpuArchitectures: Array<String>?
    get() = Build.SUPPORTED_ABIS?.takeIf { it.isNotEmpty() }

  @JS
  @Constant
  val osName: String
    get() = Build.VERSION.BASE_OS.takeIf { it.isNotEmpty() } ?: "Android"

  @JS
  @Constant
  val osVersion: String
    get() = Build.VERSION.RELEASE

  @JS
  @Constant
  val osBuildId: String
    get() = Build.DISPLAY

  @JS
  @Constant
  val osInternalBuildId: String
    get() = Build.ID

  @JS
  @Constant
  val osBuildFingerprint: String
    get() = Build.FINGERPRINT

  @JS
  @Constant
  val platformApiLevel: Int
    get() = Build.VERSION.SDK_INT

  @JS
  @Constant
  val deviceName: String?
    get() = if (Build.VERSION.SDK_INT <= 31) {
      Settings.Secure.getString(androidContext.contentResolver, "bluetooth_name")
    } else {
      Settings.Global.getString(androidContext.contentResolver, Settings.Global.DEVICE_NAME)
    }

  @JS
  suspend fun getDeviceTypeAsync(): DeviceType = withContext(Dispatchers.IO) {
    getDeviceType(androidContext)
  }

  @JS
  fun getUptimeAsync(): Promise<Double> =
    Promise.resolve(SystemClock.uptimeMillis().toDouble())

  @JS
  fun getMaxMemoryAsync(): Promise<Double> {
    val maxMemory = Runtime.getRuntime().maxMemory()
    return Promise.resolve(
      if (maxMemory != Long.MAX_VALUE) {
        maxMemory.toDouble()
      } else {
        -1.0
      }
    )
  }

  @JS
  suspend fun isRootedExperimentalAsync(): Boolean = withContext(Dispatchers.IO) {
    val isDevice = !isRunningOnEmulator

    val containsTestKeys = isDevice && Build.TAGS?.contains("test-keys") == true
    val hasSuperuserApk = File("/system/app/Superuser.apk").exists()
    val hasSu = isDevice && File("/system/xbin/su").exists()

    containsTestKeys || hasSuperuserApk || hasSu
  }

  @JS
  suspend fun isSideLoadingEnabledAsync(): Boolean = withContext(Dispatchers.IO) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      @Suppress("DEPRECATION")
      Settings.Global.getInt(
        androidContext.applicationContext.contentResolver,
        Settings.Global.INSTALL_NON_MARKET_APPS,
        0
      ) == 1
    } else {
      try {
        androidContext.applicationContext.packageManager.canRequestPackageInstalls()
      } catch (e: SecurityException) {
        // throws when REQUEST_INSTALL_PACKAGES is not declared
        throw MissingRequestInstallPackagesPermissionException(e)
      }
    }
  }

  @JS
  suspend fun getPlatformFeaturesAsync(): List<String?> = withContext(Dispatchers.IO) {
    val allFeatures = androidContext.applicationContext.packageManager.systemAvailableFeatures
    allFeatures.filterNotNull().map { it.name }
  }

  @JS
  suspend fun hasPlatformFeatureAsync(feature: String): Boolean = withContext(Dispatchers.IO) {
    androidContext.applicationContext.packageManager.hasSystemFeature(feature)
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
      val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
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
