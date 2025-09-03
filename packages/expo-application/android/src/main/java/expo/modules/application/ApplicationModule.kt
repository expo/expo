package expo.modules.application

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.RemoteException
import android.provider.Settings
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ApplicationPackageNameNotFoundException(cause: PackageManager.NameNotFoundException) :
  CodedException(message = "Unable to get install time of this application. Could not get package info or package name.", cause = cause)

class ApplicationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoApplication")

    Constant("applicationName") {
      context.applicationInfo.loadLabel(context.packageManager).toString()
    }

    Constant("applicationId") {
      packageName
    }

    Constant("nativeApplicationVersion") {
      packageManager.getPackageInfoCompat(packageName, 0).versionName
    }

    Constant("nativeBuildVersion") {
      getLongVersionCode(packageManager.getPackageInfoCompat(packageName, 0)).toInt().toString()
    }

    Constant("androidId") {
      Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
    }

    AsyncFunction<Double>("getInstallationTimeAsync") {
      val packageManager = context.packageManager
      val packageName = context.packageName
      packageManager
        .getPackageInfoCompat(packageName, 0)
        .firstInstallTime
        .toDouble()
    }

    AsyncFunction<Double>("getLastUpdateTimeAsync") {
      val packageManager = context.packageManager
      val packageName = context.packageName
      packageManager
        .getPackageInfoCompat(packageName, 0)
        .lastUpdateTime
        .toDouble()
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
                promise.reject("ERR_APPLICATION_INSTALL_REFERRER_REMOTE_EXCEPTION", "RemoteException getting install referrer information. This may happen if the process hosting the remote object is no longer available.", e)
                return
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

  private val packageName
    get() = context.packageName
  private val packageManager
    get() = context.packageManager
}

private fun PackageManager.getPackageInfoCompat(packageName: String, flags: Int = 0): PackageInfo =
  try {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(flags.toLong()))
    } else {
      @Suppress("DEPRECATION")
      getPackageInfo(packageName, flags)
    }
  } catch (e: PackageManager.NameNotFoundException) {
    throw ApplicationPackageNameNotFoundException(e)
  }

private fun getLongVersionCode(info: PackageInfo): Long {
  return if (Build.VERSION.SDK_INT >= 28) {
    info.longVersionCode
  } else {
    @Suppress("DEPRECATION")
    info.versionCode.toLong()
  }
}
