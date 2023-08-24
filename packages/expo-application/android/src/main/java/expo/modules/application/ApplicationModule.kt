package expo.modules.application

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.RemoteException
import android.provider.Settings
import android.util.Log

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener

private val TAG = ApplicationModule::class.java.simpleName

class ApplicationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoApplication")

    Constants {
      return@Constants mapOf(
        "applicationName" to applicationName,
        "applicationId" to packageName,
        "nativeApplicationVersion" to versionName,
        "nativeBuildVersion" to versionCode.toString(),
      )
    }

    AsyncFunction("getAndroidIdAsync") {
      return@AsyncFunction Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
    }

    AsyncFunction("getInstallationTimeAsync") { promise: Promise ->
      val packageManager = context.packageManager
      val packageName = context.packageName
      try {
        val info = packageManager.getPackageInfoCompat(packageName, 0)
        return@AsyncFunction info.firstInstallTime.toDouble()
      } catch (e: PackageManager.NameNotFoundException) {
        Log.e(TAG, "Exception: ", e)
        promise.reject("ERR_APPLICATION_PACKAGE_NAME_NOT_FOUND", "Unable to get install time of this application. Could not get package info or package name.", e)
      }
    }

    AsyncFunction("getLastUpdateTimeAsync") { promise: Promise ->
      val packageManager = context.packageManager
      val packageName = context.packageName
      try {
        val info = packageManager.getPackageInfoCompat(packageName, 0)
        return@AsyncFunction info.lastUpdateTime.toDouble()
      } catch (e: PackageManager.NameNotFoundException) {
        Log.e(TAG, "Exception: ", e)
        promise.reject("ERR_APPLICATION_PACKAGE_NAME_NOT_FOUND", "Unable to get last update time of this application. Could not get package info or package name.", e)
      }
    }

    AsyncFunction("getInstallReferrerAsync") { promise: Promise ->
      val installReferrer = StringBuilder()

      val referrerClient = InstallReferrerClient.newBuilder(context).build()

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
              promise.reject("ERR_APPLICATION_INSTALL_REFERRER_UNAVAILABLE", "The current Play Store app doesn't provide the installation referrer API, or the Play Store may not be installed.", null)
            InstallReferrerClient.InstallReferrerResponse.SERVICE_UNAVAILABLE -> // Connection could not be established
              promise.reject("ERR_APPLICATION_INSTALL_REFERRER", "General error retrieving the install referrer: response code $responseCode", null)
            else -> promise.reject("ERR_APPLICATION_INSTALL_REFERRER", "General error retrieving the install referrer: response code $responseCode", null)
          }
          referrerClient.endConnection()
        }

        override fun onInstallReferrerServiceDisconnected() {
          promise.reject("ERR_APPLICATION_INSTALL_REFERRER_SERVICE_DISCONNECTED", "Connection to install referrer service was lost.", null)
        }
      })
    }
  }

  private val applicationName get() = context.applicationInfo.loadLabel(context.packageManager).toString()
  private val packageName get() = context.packageName
  private val packageManager get() = context.packageManager

  private val versionName get() = packageManager.getPackageInfoCompat(packageName, 0).versionName
  private val versionCode get() = getLongVersionCode(packageManager.getPackageInfoCompat(packageName, 0)).toInt()

  companion object {
    private fun PackageManager.getPackageInfoCompat(packageName: String, flags: Int = 0): PackageInfo =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(flags.toLong()))
      } else {
        @Suppress("DEPRECATION") getPackageInfo(packageName, flags)
      }

    private fun getLongVersionCode(info: PackageInfo): Long {
      return if (Build.VERSION.SDK_INT >= 28) {
        info.longVersionCode
      } else {
        @Suppress("DEPRECATION") info.versionCode.toLong()
      }
    }
  }
}
