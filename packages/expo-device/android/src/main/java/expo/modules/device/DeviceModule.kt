package expo.modules.device

import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.utilities.EmulatorUtilities

import com.facebook.device.yearclass.YearClass

import android.app.ActivityManager
import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.view.WindowManager
import android.util.DisplayMetrics

import java.io.File
import kotlin.math.pow
import kotlin.math.sqrt

private const val NAME = "ExpoDevice"

class DeviceModule(private val mContext: Context) : ExportedModule(mContext) {
  // Keep this enum in sync with JavaScript
  enum class DeviceType(val JSValue: Int) {
    UNKNOWN(0),
    PHONE(1),
    TABLET(2),
    DESKTOP(3),
    TV(4);
  }

  override fun getName(): String {
    return NAME
  }

  override fun getConstants(): Map<String, Any> = mapOf(
    "isDevice" to !isRunningOnEmulator,
    "brand" to Build.BRAND,
    "manufacturer" to Build.MANUFACTURER,
    "modelName" to Build.MODEL,
    "designName" to Build.DEVICE,
    "productName" to Build.DEVICE,
    "deviceYearClass" to deviceYearClass,
    "totalMemory" to run {
      val memoryInfo = ActivityManager.MemoryInfo()
      (mContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memoryInfo)
      memoryInfo.totalMem
    },
    "supportedCpuArchitectures" to run {
      var supportedAbis = Build.SUPPORTED_ABIS
      if (supportedAbis != null && supportedAbis.isEmpty()) {
        supportedAbis = null
      }
      supportedAbis
    },
    "osName" to systemName,
    "osVersion" to Build.VERSION.RELEASE,
    "osBuildId" to Build.DISPLAY,
    "osInternalBuildId" to Build.ID,
    "osBuildFingerprint" to Build.FINGERPRINT,
    "platformApiLevel" to Build.VERSION.SDK_INT,
    "deviceName" to run {
      if (Build.VERSION.SDK_INT <= 31)
        Settings.Secure.getString(mContext.contentResolver, "bluetooth_name")
      else
        Settings.Global.getString(mContext.contentResolver, Settings.Global.DEVICE_NAME)
    },
  )

  private val deviceYearClass: Int
    get() = YearClass.get(mContext)

  private val systemName: String
    get() {
      return if (Build.VERSION.SDK_INT < 23) {
        "Android"
      } else {
        Build.VERSION.BASE_OS.takeIf { it.isNotEmpty() } ?: "Android"
      }
    }

  @ExpoMethod
  fun getDeviceTypeAsync(promise: Promise) {
    promise.resolve(getDeviceType(mContext).JSValue)
  }

  @ExpoMethod
  fun getUptimeAsync(promise: Promise) {
    promise.resolve(SystemClock.uptimeMillis().toDouble())
  }

  @ExpoMethod
  fun getMaxMemoryAsync(promise: Promise) {
    val maxMemory = Runtime.getRuntime().maxMemory()
    promise.resolve(if (maxMemory != Long.MAX_VALUE) maxMemory.toDouble() else -1)
  }

  @ExpoMethod
  fun isRootedExperimentalAsync(promise: Promise) {
    var isRooted = false
    val isDevice = !isRunningOnEmulator

    try {
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
    } catch (se: SecurityException) {
      promise.reject(
        "ERR_DEVICE_ROOT_DETECTION",
        "Could not access the file system to determine if the device is rooted.",
        se
      )
      return
    }

    promise.resolve(isRooted)
  }

  @ExpoMethod
  fun isSideLoadingEnabledAsync(promise: Promise) {
    val enabled: Boolean = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      Settings.Global.getInt(
        mContext.applicationContext.contentResolver,
        Settings.Global.INSTALL_NON_MARKET_APPS,
        0
      ) == 1
    } else {
      mContext.applicationContext.packageManager.canRequestPackageInstalls()
    }

    promise.resolve(enabled)
  }

  @ExpoMethod
  fun getPlatformFeaturesAsync(promise: Promise) {
    val allFeatures = mContext.applicationContext.packageManager.systemAvailableFeatures
    val featureList = allFeatures.filterNotNull().map { it.name }
    promise.resolve(featureList)
  }

  @ExpoMethod
  fun hasPlatformFeatureAsync(feature: String, promise: Promise) {
    promise.resolve(mContext.applicationContext.packageManager.hasSystemFeature(feature))
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
      val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager? ?: return DeviceType.UNKNOWN

      // Get display metrics to see if we can differentiate phones and tablets.
      val metrics = DisplayMetrics()
      windowManager.defaultDisplay.getMetrics(metrics)

      // Calculate physical size.
      val widthInches = metrics.widthPixels / metrics.xdpi.toDouble()
      val heightInches = metrics.heightPixels / metrics.ydpi.toDouble()
      val diagonalSizeInches = sqrt(widthInches.pow(2.0) + heightInches.pow(2.0))
      return if (diagonalSizeInches >= 3.0 && diagonalSizeInches <= 6.9) {
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
