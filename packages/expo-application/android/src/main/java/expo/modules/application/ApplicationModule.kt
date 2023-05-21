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

    AsyncFunction("getInstallationTimeAsync") {
      val packageManager = context.packageManager
      val packageName = context.packageName
      try {
        val info = packageManager.getPackageInfoCompat(packageName, 0)
        return@AsyncFunction info.firstInstallTime.toDouble()
      } catch (e: PackageManager.NameNotFoundException) {
        throw UnableToGetInstallationTimeException(e)
      }
    }

    AsyncFunction("getLastUpdateTimeAsync") {
      val packageManager = context.packageManager
      val packageName = context.packageName
      try {
        val info = packageManager.getPackageInfoCompat(packageName, 0)
        return@AsyncFunction info.lastUpdateTime.toDouble()
      } catch (e: PackageManager.NameNotFoundException) {
        throw UnableToGetLastUpdateTimeException(e)
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
                promise.reject(ApplicationInstallReferrerRemoteException(e))
              }
              promise.resolve(installReferrer.toString())
            }
            InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED -> // API not available in the current Play Store app
              promise.reject(ApplicationInstallReferrerUnavailableException())
            InstallReferrerClient.InstallReferrerResponse.SERVICE_UNAVAILABLE -> // Connection could not be established
              promise.reject(ApplicationInstallReferrerConnectionException())
            else -> promise.reject(ApplicationInstallReferrerException(responseCode.toString()))
          }
          referrerClient.endConnection()
        }

        override fun onInstallReferrerServiceDisconnected() {
          promise.reject(ApplicationInstallReferrerServiceDisconnectedException())
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
