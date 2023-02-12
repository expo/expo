package abi47_0_0.expo.modules.network

import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod
import abi47_0_0.expo.modules.core.interfaces.RegistryLifecycleListener

import android.util.Log
import android.os.Build
import android.os.Bundle
import android.content.Context
import android.net.NetworkInfo
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.provider.Settings

import java.lang.Exception
import java.math.BigInteger
import java.net.InetAddress
import java.net.UnknownHostException
import java.nio.ByteOrder

private const val NAME = "ExpoNetwork"
private val TAG = NetworkModule::class.java.simpleName

class NetworkModule(private val appContext: Context) : ExportedModule(appContext), RegistryLifecycleListener {

  enum class NetworkStateType(val value: String) {
    NONE("NONE"),
    UNKNOWN("UNKNOWN"),
    CELLULAR("CELLULAR"),
    WIFI("WIFI"),
    BLUETOOTH("BLUETOOTH"),
    ETHERNET("ETHERNET"),
    WIMAX("WIMAX"),
    VPN("VPN"),
    OTHER("OTHER");

    val isDefined: Boolean
      get() = this.value != "NONE" && this.value != "UNKNOWN"
  }

  override fun getName() = NAME

  private val wifiInfo: WifiInfo
    get() = try {
      val manager = appContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
      manager.connectionInfo
    } catch (e: Exception) {
      Log.e(TAG, e.message ?: "Wi-Fi information could not be acquired")
      throw e
    }

  private fun getConnectionType(netInfo: NetworkInfo?): NetworkStateType = when (netInfo?.type) {
    ConnectivityManager.TYPE_MOBILE,
    ConnectivityManager.TYPE_MOBILE_DUN -> NetworkStateType.CELLULAR
    ConnectivityManager.TYPE_WIFI -> NetworkStateType.WIFI
    ConnectivityManager.TYPE_BLUETOOTH -> NetworkStateType.BLUETOOTH
    ConnectivityManager.TYPE_ETHERNET -> NetworkStateType.ETHERNET
    ConnectivityManager.TYPE_WIMAX -> NetworkStateType.WIMAX
    ConnectivityManager.TYPE_VPN -> NetworkStateType.VPN
    else -> NetworkStateType.UNKNOWN
  }

  private fun getConnectionType(netCapabilities: NetworkCapabilities?): NetworkStateType =
    when {
      netCapabilities == null -> NetworkStateType.UNKNOWN
      netCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> NetworkStateType.CELLULAR
      netCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || netCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI_AWARE) -> NetworkStateType.WIFI
      netCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) -> NetworkStateType.BLUETOOTH
      netCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> NetworkStateType.ETHERNET
      netCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> NetworkStateType.VPN
      else -> NetworkStateType.UNKNOWN
    }

  private fun rawIpToString(ip: Int): String {
    // Convert little-endian to big-endian if needed
    val ip = if (ByteOrder.nativeOrder() == ByteOrder.LITTLE_ENDIAN) {
      Integer.reverseBytes(ip)
    } else {
      ip
    }

    var ipByteArray = BigInteger.valueOf(ip.toLong()).toByteArray()
    if (ipByteArray.size < 4) {
      ipByteArray = frontPadWithZeros(ipByteArray)
    }

    return try {
      InetAddress.getByAddress(ipByteArray).hostAddress
    } catch (e: UnknownHostException) {
      "0.0.0.0"
    }
  }

  @ExpoMethod
  fun getNetworkStateAsync(promise: Promise) {
    val result = Bundle()
    val connectivityManager = appContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    try {
      if (Build.VERSION.SDK_INT < 29) { // use getActiveNetworkInfo before api level 29
        val netInfo = connectivityManager.activeNetworkInfo
        val connectionType = getConnectionType(netInfo)

        result.apply {
          putBoolean("isInternetReachable", netInfo!!.isConnected)
          putString("type", connectionType.value)
          putBoolean("isConnected", connectionType.isDefined)
        }

        promise.resolve(result)
      } else {
        val network = connectivityManager.activeNetwork
        val isInternetReachable = network != null

        val connectionType = if (isInternetReachable) {
          val netCapabilities = connectivityManager.getNetworkCapabilities(network)
          getConnectionType(netCapabilities)
        } else {
          null
        }

        result.apply {
          putString("type", connectionType?.value ?: NetworkStateType.NONE.value)
          putBoolean("isInternetReachable", isInternetReachable)
          putBoolean("isConnected", connectionType != null && connectionType.isDefined)
        }

        promise.resolve(result)
      }
    } catch (e: Exception) {
      promise.reject("ERR_NETWORK_NO_ACCESS_NETWORKINFO", "Unable to access network information", e)
    }
  }

  @ExpoMethod
  fun getIpAddressAsync(promise: Promise) {
    try {
      promise.resolve(rawIpToString(wifiInfo.ipAddress))
    } catch (e: Exception) {
      Log.e(TAG, e.message ?: "Could not get IP address")
      promise.reject("ERR_NETWORK_IP_ADDRESS", "Unknown Host Exception", e)
    }
  }

  @ExpoMethod
  fun isAirplaneModeEnabledAsync(promise: Promise) {
    val isAirplaneMode = Settings.Global.getInt(appContext.contentResolver, Settings.Global.AIRPLANE_MODE_ON, 0) != 0
    promise.resolve(isAirplaneMode)
  }
}
