package expo.modules.application

import android.annotation.SuppressLint
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.RemoteException
import android.provider.Settings
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import io.github.expo.modules.v2.Constant
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@ExpoModule("ExpoApplication")
class ApplicationModule : Module() {
  private val packageInfo: PackageInfo
    get() = androidContext.packageManager.getPackageInfoCompat(androidContext.packageName)

  @JS
  @Constant
  val applicationName: String
    get() = androidContext.applicationInfo.loadLabel(androidContext.packageManager).toString()

  @JS
  @Constant
  val applicationId: String
    get() = androidContext.packageName

  @JS
  @Constant
  val nativeApplicationVersion: String?
    get() = packageInfo.versionName

  @JS
  @Constant
  val nativeBuildVersion: String
    get() = getLongVersionCode(packageInfo).toInt().toString()

  @JS
  @Constant
  @get:SuppressLint("HardwareIds")
  val androidId: String?
    get() = Settings.Secure.getString(androidContext.contentResolver, Settings.Secure.ANDROID_ID)

  @JS
  suspend fun getInstallationTimeAsync(): Double = withContext(Dispatchers.IO) {
    packageInfo.firstInstallTime.toDouble()
  }

  @JS
  suspend fun getLastUpdateTimeAsync(): Double = withContext(Dispatchers.IO) {
    packageInfo.lastUpdateTime.toDouble()
  }

  @JS
  suspend fun getInstallReferrerAsync(): String = suspendCancellableCoroutine { continuation ->
    val referrerClient = InstallReferrerClient.newBuilder(androidContext).build()

    val listener = object : InstallReferrerStateListener {
      override fun onInstallReferrerSetupFinished(responseCode: Int) {
        if (!continuation.isActive) {
          return
        }

        when (responseCode) {
          InstallReferrerClient.InstallReferrerResponse.OK -> {
            // Connection established and response received
            try {
              val installReferrer: String? = referrerClient.installReferrer.installReferrer
              continuation.resume(installReferrer.toString())
            } catch (e: RemoteException) {
              continuation.resumeWithException(ApplicationInstallReferrerRemoteException(e))
            }
          }

          InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED -> {
            // API not available in the current Play Store app
            continuation.resumeWithException(ApplicationInstallReferrerUnavailableException())
          }

          else -> {
            // Includes SERVICE_UNAVAILABLE, when the connection could not be established
            continuation.resumeWithException(ApplicationInstallReferrerException(responseCode))
          }
        }
        referrerClient.endConnection()
      }

      override fun onInstallReferrerServiceDisconnected() {
        if (!continuation.isActive) {
          return
        }
        continuation.resumeWithException(ApplicationInstallReferrerServiceDisconnectedException())
      }
    }

    referrerClient.startConnection(listener)
  }
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
