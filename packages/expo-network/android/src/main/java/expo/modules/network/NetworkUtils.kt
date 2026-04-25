package expo.modules.network

import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.NetworkInfo
import android.os.Build
import android.util.Log

private val TAG = NetworkModule::class.java.simpleName

internal fun frontPadWithZeros(inputArray: ByteArray): ByteArray {
  val newByteArray = byteArrayOf(0, 0, 0, 0)
  System.arraycopy(inputArray, 0, newByteArray, 4 - inputArray.size, inputArray.size)
  return newByteArray
}

/**
 * Returns whether the device can reach the Internet.
 * Checks that the active network has both the INTERNET and VALIDATED
 * capabilities, is not suspended, and (for VPN connections) has non
 * zero downstream bandwidth.
 */
internal fun isInternetReachable(
  connectivityManager: ConnectivityManager,
  sdkInt: Int = Build.VERSION.SDK_INT
): Boolean {
  val network = connectivityManager.activeNetwork ?: return false
  val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false

  val isInternetSuspended = if (sdkInt >= Build.VERSION_CODES.Q) {
    !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_SUSPENDED)
  } else {
    val networkInfo = try {
      connectivityManager.getNetworkInfo(network)
    } catch (e: SecurityException) {
      Log.w(TAG, "expo-network could not read network state: missing ACCESS_NETWORK_STATE permission", e)
      null
    }
    networkInfo == null || networkInfo.detailedState != NetworkInfo.DetailedState.CONNECTED
  }

  var isReachable =
    capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
    capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) &&
    !isInternetSuspended

  if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
    isReachable = isReachable && capabilities.linkDownstreamBandwidthKbps != 0
  }

  return isReachable
}
