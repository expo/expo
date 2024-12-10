package expo.modules.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.NetworkInfo
import android.net.NetworkRequest
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.math.BigInteger
import java.net.InetAddress
import java.net.UnknownHostException
import java.nio.ByteOrder

private val TAG = NetworkModule::class.java.simpleName

internal const val NETWORK_STATE_EVENT_NAME = "onNetworkStateChanged"

class NetworkModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val connectivityManager: ConnectivityManager
    get() = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    override fun onAvailable(network: android.net.Network) {
      emitNetworkState()
    }

    override fun onLost(network: android.net.Network) {
      emitNetworkState()
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoNetwork")

    Events(NETWORK_STATE_EVENT_NAME)

    OnCreate {
      val networkRequest = NetworkRequest.Builder().build()
      connectivityManager.registerNetworkCallback(
        networkRequest,
        networkCallback
      )
    }

    OnDestroy {
      connectivityManager.unregisterNetworkCallback(networkCallback)
    }

    AsyncFunction("getNetworkStateAsync") {
      return@AsyncFunction fetchNetworkState()
    }

    AsyncFunction<String>("getIpAddressAsync") {
      return@AsyncFunction rawIpToString(wifiInfo.ipAddress)
    }

    AsyncFunction<Boolean>("isAirplaneModeEnabledAsync") {
      return@AsyncFunction Settings.Global.getInt(context.contentResolver, Settings.Global.AIRPLANE_MODE_ON, 0) != 0
    }
  }

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

  private fun emitNetworkState() {
    val networkState = fetchNetworkState()
    sendEvent(NETWORK_STATE_EVENT_NAME, networkState)
  }

  private fun fetchNetworkState(): Bundle {
    val result = Bundle()

    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) { // use getActiveNetworkInfo before api level 29
        val netInfo = connectivityManager.activeNetworkInfo
        val connectionType = getConnectionType(netInfo)

        result.apply {
          putBoolean("isInternetReachable", netInfo!!.isConnected)
          putString("type", connectionType.value)
          putBoolean("isConnected", connectionType.isDefined)
        }

        return result
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
        return result
      }
    } catch (e: Exception) {
      result.apply {
        putString("type", NetworkStateType.UNKNOWN.value)
        putBoolean("isInternetReachable", false)
        putBoolean("isConnected", false)
      }
      return result
    }
  }

  private val wifiInfo: WifiInfo
    get() = try {
      val manager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
      manager.connectionInfo
    } catch (e: Exception) {
      Log.e(TAG, e.message ?: "Wi-Fi information could not be acquired")
      throw NetworkWifiException(e)
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

  private fun rawIpToString(ipAddress: Int): String {
    // Convert little-endian to big-endian if needed
    val ip = if (ByteOrder.nativeOrder() == ByteOrder.LITTLE_ENDIAN) {
      Integer.reverseBytes(ipAddress)
    } else {
      ipAddress
    }

    var ipByteArray = BigInteger.valueOf(ip.toLong()).toByteArray()
    if (ipByteArray.size < 4) {
      ipByteArray = frontPadWithZeros(ipByteArray)
    }

    return try {
      InetAddress.getByAddress(ipByteArray).hostAddress as String
    } catch (e: UnknownHostException) {
      "0.0.0.0"
    }
  }
}
