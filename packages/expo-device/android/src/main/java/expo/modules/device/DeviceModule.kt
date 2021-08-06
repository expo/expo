package expo.modules.device

import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.RegistryLifecycleListener
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod

import com.facebook.device.yearclass.YearClass

import android.app.Activity
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
import java.util.ArrayList
import java.util.HashMap
import kotlin.math.pow
import kotlin.math.sqrt

private const val NAME = "ExpoDevice"

class DeviceModule(private val mContext: Context) : ExportedModule(mContext), RegistryLifecycleListener {
  private var mModuleRegistry: ModuleRegistry? = null
  private var mActivityProvider: ActivityProvider? = null
  private var mActivity: Activity? = null

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

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mModuleRegistry = moduleRegistry
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    mActivity = mActivityProvider?.currentActivity
  }

  override fun getConstants(): Map<String, Any> {
    val constants = HashMap<String, Any>()

    constants["isDevice"] = !isRunningOnGenymotion && !isRunningOnStockEmulator
    constants["brand"] = Build.BRAND
    constants["manufacturer"] = Build.MANUFACTURER
    constants["modelName"] = Build.MODEL
    constants["designName"] = Build.DEVICE
    constants["productName"] = Build.PRODUCT
    constants["deviceYearClass"] = deviceYearClass

    val activityManager = mContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val memoryInfo = ActivityManager.MemoryInfo()
    activityManager.getMemoryInfo(memoryInfo)

    constants["totalMemory"] = memoryInfo.totalMem

    var supportedAbis = Build.SUPPORTED_ABIS
    if (supportedAbis != null && supportedAbis.isEmpty()) {
      supportedAbis = null
    }

    constants["supportedCpuArchitectures"] = supportedAbis
    constants["osName"] = systemName
    constants["osVersion"] = Build.VERSION.RELEASE
    constants["osBuildId"] = Build.DISPLAY
    constants["osInternalBuildId"] = Build.ID
    constants["osBuildFingerprint"] = Build.FINGERPRINT
    constants["platformApiLevel"] = Build.VERSION.SDK_INT
    constants["deviceName"] = Settings.Secure.getString(mContext.contentResolver, "bluetooth_name")

    return constants
  }

  private val deviceYearClass: Int
    get() = YearClass.get(mContext)
  private val systemName: String
    get() {
      var systemName: String
      if (Build.VERSION.SDK_INT < 23) {
        systemName = "Android"
      } else {
        systemName = Build.VERSION.BASE_OS
        if (systemName.isEmpty()) {
          systemName = "Android"
        }
      }
      return systemName
    }

  @ExpoMethod
  fun getDeviceTypeAsync(promise: Promise) {
    val mDeviceType = getDeviceType(mContext)
    promise.resolve(mDeviceType.JSValue)
  }

  @ExpoMethod
  fun getUptimeAsync(promise: Promise) {
    val uptime = SystemClock.uptimeMillis()
    promise.resolve(uptime.toDouble())
  }

  @ExpoMethod
  fun getMaxMemoryAsync(promise: Promise) {
    val maxMemory = Runtime.getRuntime().maxMemory()
    if (maxMemory == Long.MAX_VALUE) {
      // convert into maximum integer that JS could fit
      promise.resolve(-1)
    } else {
      promise.resolve(maxMemory.toDouble())
    }
  }

  @ExpoMethod
  fun isRootedExperimentalAsync(promise: Promise) {
    var isRooted = false
    val isDevice = !isRunningOnGenymotion && !isRunningOnStockEmulator

    try {
      val buildTags = Build.TAGS
      if (isDevice && buildTags != null && buildTags.contains("test-keys")) {
        isRooted = true
      } else {
        var file = File("/system/app/Superuser.apk")
        if (file.exists()) {
          isRooted = true
        } else {
          file = File("/system/xbin/su")
          isRooted = isDevice && file.exists()
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
    val featureList: MutableList<String> = ArrayList()

    for (i in allFeatures.indices) {
      if (allFeatures[i].name != null) {
        featureList.add(allFeatures[i].name)
      }
    }

    promise.resolve(featureList)
  }

  @ExpoMethod
  fun hasPlatformFeatureAsync(feature: String, promise: Promise) {
    promise.resolve(mContext.applicationContext.packageManager.hasSystemFeature(feature))
  }

  companion object {
    private val TAG = DeviceModule::class.java.simpleName

    private val isRunningOnGenymotion: Boolean
      get() = Build.FINGERPRINT.contains("vbox")
    private val isRunningOnStockEmulator: Boolean
      get() = Build.FINGERPRINT.contains("generic")

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
