package expo.modules.network

import android.annotation.SuppressLint
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
import android.telephony.TelephonyManager
import android.util.Log
import androidx.annotation.RequiresApi
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.math.BigInteger
import java.net.Inet4Address
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
        val isInternetReachable = netInfo?.isConnected ?: false

        result.apply {
          putBoolean("isInternetReachable", isInternetReachable)
          putString("type", connectionType.value)
          putBoolean("isConnected", connectionType.isDefined)
          putBundle("details", getDetailsForNetworkType(connectionType, connectivityManager))
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
          putBundle("details", getDetailsForNetworkType(connectionType, connectivityManager))
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

  private fun getSubnetMask(connectivityManager: ConnectivityManager): String? {
    val network = connectivityManager.activeNetwork
    val linkProperties = connectivityManager.getLinkProperties(network)

    return linkProperties?.linkAddresses?.firstOrNull { it.address is Inet4Address }?.let { linkAddress ->
      val prefixLength = linkAddress.prefixLength
      val mask = -0x1 shl (32 - prefixLength)
      return ((mask ushr 24) and 0xFF).toString() + "." +
        ((mask ushr 16) and 0xFF) + "." +
        ((mask ushr 8) and 0xFF) + "." +
        (mask and 0xFF)
    }
  }

  private fun getDetailsForNetworkType(connectionType: NetworkStateType?, connectivityManager: ConnectivityManager): Bundle {
    val isConnectionExpensive = connectivityManager.isActiveNetworkMetered()

    val details = Bundle().apply {
      putBoolean("isConnectionExpensive", isConnectionExpensive)
    }

    if (connectionType == NetworkStateType.WIFI) {
      details.putString("subnet", getSubnetMask(connectivityManager))
    } else if (connectionType == NetworkStateType.CELLULAR) {
      details.putString("cellularGeneration", getCellularGeneration(connectivityManager).value)
    }

    return details
  }

  @SuppressLint("MissingPermission")
  private fun getCellularGeneration(connectivityManager: ConnectivityManager): NetworkCellularGeneration {


    val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    val networkType = if (Build.VERSION.SDK_INT > 23) {
      telephonyManager.dataNetworkType
    } else {
      val networkInfo: NetworkInfo? = connectivityManager.getActiveNetworkInfo()
      networkInfo?.subtype
    }



    return when (networkType) {
      TelephonyManager.NETWORK_TYPE_GPRS,
      TelephonyManager.NETWORK_TYPE_EDGE,
      TelephonyManager.NETWORK_TYPE_CDMA,
      TelephonyManager.NETWORK_TYPE_1xRTT,
      TelephonyManager.NETWORK_TYPE_IDEN -> {
        NetworkCellularGeneration.CELLULAR_GEN_2G
      }

      TelephonyManager.NETWORK_TYPE_UMTS,
      TelephonyManager.NETWORK_TYPE_EVDO_0,
      TelephonyManager.NETWORK_TYPE_EVDO_A,
      TelephonyManager.NETWORK_TYPE_HSDPA,
      TelephonyManager.NETWORK_TYPE_HSUPA,
      TelephonyManager.NETWORK_TYPE_HSPA,
      TelephonyManager.NETWORK_TYPE_EVDO_B,
      TelephonyManager.NETWORK_TYPE_EHRPD,
      TelephonyManager.NETWORK_TYPE_HSPAP -> {
        NetworkCellularGeneration.CELLULAR_GEN_3G
      }

      TelephonyManager.NETWORK_TYPE_LTE -> {
        NetworkCellularGeneration.CELLULAR_GEN_4G
      }

      TelephonyManager.NETWORK_TYPE_NR -> {
        NetworkCellularGeneration.CELLULAR_GEN_5G
      }

      TelephonyManager.NETWORK_TYPE_UNKNOWN -> {
        NetworkCellularGeneration.UNKNOWN
      }

      else -> NetworkCellularGeneration.UNKNOWN
    }
  }
}


