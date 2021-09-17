package expo.modules.network

import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.RegistryLifecycleListener
import expo.modules.core.ModuleRegistry
import android.app.Activity
import android.content.Context
import expo.modules.network.NetworkModule
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.net.NetworkInfo
import expo.modules.network.NetworkModule.NetworkStateType
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import expo.modules.core.interfaces.ExpoMethod
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityProvider
import java.lang.Exception
import java.math.BigInteger
import java.net.InetAddress
import java.net.UnknownHostException
import java.nio.ByteOrder

private const val NAME = "ExpoNetwork"
private val TAG = NetworkModule::class.java.simpleName

class NetworkModule(
    private val mContext: Context
) : ExportedModule(mContext), RegistryLifecycleListener {

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


    fun equal(value: String): Boolean {
      return this.value == value
    }
  }

  override fun getName() = NAME

  private val wifiInfo: WifiInfo
    private get() = try {
      val manager = mContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
      manager.connectionInfo
    } catch (e: Exception) {
      Log.e(TAG, e.message!!)
      throw e
    }

  private fun getConnectionType(netinfo: NetworkInfo?): NetworkStateType {
    return when (netinfo!!.type) {
      ConnectivityManager.TYPE_MOBILE, ConnectivityManager.TYPE_MOBILE_DUN -> NetworkStateType.CELLULAR
      ConnectivityManager.TYPE_WIFI -> NetworkStateType.WIFI
      ConnectivityManager.TYPE_BLUETOOTH -> NetworkStateType.BLUETOOTH
      ConnectivityManager.TYPE_ETHERNET -> NetworkStateType.ETHERNET
      ConnectivityManager.TYPE_WIMAX -> NetworkStateType.WIMAX
      ConnectivityManager.TYPE_VPN -> NetworkStateType.VPN
      else -> NetworkStateType.UNKNOWN
    }
  }

  private fun getConnectionType(nc: NetworkCapabilities?): NetworkStateType {
    if (nc!!.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) return NetworkStateType.CELLULAR
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI_AWARE)) return NetworkStateType.WIFI
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) return NetworkStateType.BLUETOOTH
    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return NetworkStateType.ETHERNET
    return if (nc.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) NetworkStateType.VPN else NetworkStateType.UNKNOWN
  }

  private fun rawIpToString(ip: Int): String {
    // Convert little-endian to big-endian if needed
    var ip = ip
    if (ByteOrder.nativeOrder() == ByteOrder.LITTLE_ENDIAN) {
      ip = Integer.reverseBytes(ip)
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
    val cm = mContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    //use getActiveNetworkInfo before api level 29
    if (Build.VERSION.SDK_INT < 29) {
      try {
        val netInfo = cm.activeNetworkInfo
        result.putBoolean("isInternetReachable", netInfo!!.isConnected)
        val mConnectionType = getConnectionType(netInfo)
        result.putString("type", mConnectionType.value)
        result.putBoolean("isConnected", !mConnectionType.equal("NONE") && !mConnectionType.equal("UNKNOWN"))
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject("ERR_NETWORK_NO_ACCESS_NETWORKINFO", "Unable to access network information", e)
      }
    } else {
      try {
        val network = cm.activeNetwork
        val isInternetReachable = network != null
        var connectionType: NetworkStateType? = null
        if (isInternetReachable) {
          val nc = cm.getNetworkCapabilities(network)
          connectionType = getConnectionType(nc)
          result.putString("type", connectionType.value)
        } else {
          result.putString("type", NetworkStateType.NONE.value)
        }
        result.putBoolean("isInternetReachable", isInternetReachable)
        result.putBoolean("isConnected", connectionType != null && !connectionType.equal("NONE") && !connectionType.equal("UNKNOWN"))
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject("ERR_NETWORK_NO_ACCESS_NETWORKINFO", "Unable to access network information", e)
      }
    }
  }

  @ExpoMethod
  fun getIpAddressAsync(promise: Promise) {
    try {
      val ipAddress = wifiInfo.ipAddress
      val ipAddressString = rawIpToString(ipAddress)
      promise.resolve(ipAddressString)
    } catch (e: Exception) {
      Log.e(TAG, e.message!!)
      promise.reject("ERR_NETWORK_IP_ADDRESS", "Unknown Host Exception", e)
    }
  }

  @ExpoMethod
  fun isAirplaneModeEnabledAsync(promise: Promise) {
    val isAirPlaneMode = Settings.Global.getInt(mContext.contentResolver, Settings.Global.AIRPLANE_MODE_ON, 0) != 0
    promise.resolve(isAirPlaneMode)
  }

  companion object {
    private fun frontPadWithZeros(inputArray: ByteArray): ByteArray {
      val newByteArray = byteArrayOf(0, 0, 0, 0)
      System.arraycopy(inputArray, 0, newByteArray, 4 - inputArray.size, inputArray.size)
      return newByteArray
    }
  }
}