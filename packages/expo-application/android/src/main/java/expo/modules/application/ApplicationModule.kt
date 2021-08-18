package expo.modules.application

import android.app.Activity
import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager.NameNotFoundException
import android.os.Build
import android.os.RemoteException
import android.provider.Settings
import android.util.Log

import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener

import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.RegistryLifecycleListener

import java.util.*

private const val NAME = "ExpoApplication"
private val TAG = ApplicationModule::class.java.simpleName

class ApplicationModule(private val mContext: Context) : ExportedModule(mContext), RegistryLifecycleListener {
  private var mModuleRegistry: ModuleRegistry? = null
  private var mActivityProvider: ActivityProvider? = null
  private var mActivity: Activity? = null

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mModuleRegistry = moduleRegistry
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    mActivity = mActivityProvider?.currentActivity
  }

  override fun getConstants(): Map<String, Any?> {
    val constants = HashMap<String, Any?>()
    val applicationName = mContext.applicationInfo.loadLabel(mContext.packageManager).toString()
    val packageName = mContext.packageName

    constants["applicationName"] = applicationName
    constants["applicationId"] = packageName

    val packageManager = mContext.packageManager
    try {
      val pInfo = packageManager.getPackageInfo(packageName, 0)
      constants["nativeApplicationVersion"] = pInfo.versionName
      val versionCode = getLongVersionCode(pInfo).toInt()
      constants["nativeBuildVersion"] = versionCode.toString()
    } catch (e: NameNotFoundException) {
      Log.e(TAG, "Exception: ", e)
    }

    constants["androidId"] = Settings.Secure.getString(mContext.contentResolver, Settings.Secure.ANDROID_ID)

    return constants
  }

  @ExpoMethod
  fun getInstallationTimeAsync(promise: Promise) {
    val packageManager = mContext.packageManager
    val packageName = mContext.packageName
    try {
      val info = packageManager.getPackageInfo(packageName, 0)
      promise.resolve(info.firstInstallTime.toDouble())
    } catch (e: NameNotFoundException) {
      Log.e(TAG, "Exception: ", e)
      promise.reject("ERR_APPLICATION_PACKAGE_NAME_NOT_FOUND", "Unable to get install time of this application. Could not get package info or package name.", e)
    }
  }

  @ExpoMethod
  fun getLastUpdateTimeAsync(promise: Promise) {
    val packageManager = mContext.packageManager
    val packageName = mContext.packageName
    try {
      val info = packageManager.getPackageInfo(packageName, 0)
      promise.resolve(info.lastUpdateTime.toDouble())
    } catch (e: NameNotFoundException) {
      Log.e(TAG, "Exception: ", e)
      promise.reject("ERR_APPLICATION_PACKAGE_NAME_NOT_FOUND", "Unable to get last update time of this application. Could not get package info or package name.", e)
    }
  }

  @ExpoMethod
  fun getInstallReferrerAsync(promise: Promise) {
    val installReferrer = StringBuilder()
    val referrerClient = InstallReferrerClient.newBuilder(mContext).build()
    referrerClient.startConnection(object : InstallReferrerStateListener {
      override fun onInstallReferrerSetupFinished(responseCode: Int) {
        when (responseCode) {
          InstallReferrerClient.InstallReferrerResponse.OK -> {
            // Connection established and response received
            try {
              val response = referrerClient.installReferrer
              installReferrer.append(response.installReferrer)
            } catch (e: RemoteException) {
              Log.e(TAG, "Exception: ", e)
              promise.reject("ERR_APPLICATION_INSTALL_REFERRER_REMOTE_EXCEPTION", "RemoteException getting install referrer information. This may happen if the process hosting the remote object is no longer available.", e)
            }
            promise.resolve(installReferrer.toString())
          }
          InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED -> // API not available in the current Play Store app
            promise.reject("ERR_APPLICATION_INSTALL_REFERRER_UNAVAILABLE", "The current Play Store app doesn't provide the installation referrer API, or the Play Store may not be installed.")
          InstallReferrerClient.InstallReferrerResponse.SERVICE_UNAVAILABLE -> // Connection could not be established
            promise.reject("ERR_APPLICATION_INSTALL_REFERRER_CONNECTION", "Could not establish a connection to Google Play")
          else -> promise.reject("ERR_APPLICATION_INSTALL_REFERRER", "General error retrieving the install referrer: response code $responseCode")
        }
        referrerClient.endConnection()
      }

      override fun onInstallReferrerServiceDisconnected() {
        promise.reject("ERR_APPLICATION_INSTALL_REFERRER_SERVICE_DISCONNECTED", "Connection to install referrer service was lost.")
      }
    })
  }

  companion object {
    private fun getLongVersionCode(info: PackageInfo): Long {
      return if (Build.VERSION.SDK_INT >= 28) {
        info.longVersionCode
      } else {
        info.versionCode.toLong()
      }
    }
  }
}
