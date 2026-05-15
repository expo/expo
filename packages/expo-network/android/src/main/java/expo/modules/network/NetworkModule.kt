package expo.modules.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkInfo
import android.net.NetworkRequest
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
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
  private val mainHandler = Handler(Looper.getMainLooper())
  private val DELAY_MS = 250

  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    override fun onAvailable(network: android.net.Network) {
      asyncEmitNetworkState(DELAY_MS)
    }

    override fun onLost(lostNetwork: android.net.Network) {
      // We intentionally do NOT reuse asyncEmitNetworkState(DELAY_MS) here.
      //
      // The 250ms delay used by onAvailable cannot be applied to onLost. On
      // Android 13+, connectivityManager.activeNetwork continues to return the
      // just-lost Network object even after the delay. Re-querying it would
      // emit a stale "isConnected = true" event — the exact bug reported in
      // https://github.com/expo/expo/issues/37972. This behavior isn't
      // documented by AOSP as version-specific, so we apply this check
      // defensively on all API 29+ devices.
      //
      // Instead, we compare the lost network against the current active network.
      // If they match (or activeNetwork is null), there is no replacement
      // network and we emit a disconnected state directly. If a different
      // network is active (e.g. cellular), we emit
      // its state instead.
      //
      // Note: android.net.Network.equals() compares by netId, so the check
      // below is a reliable "same network" comparison.
      //
      // We still post to the main looper because sendEvent must run on the
      // main thread; we just skip the artificial delay.
      mainHandler.post {
        try {
          val activeNetwork = connectivityManager.activeNetwork
          if (activeNetwork == null || activeNetwork == lostNetwork) {
            val result = Bundle().apply {
              putString("type", NetworkStateType.NONE.value)
              putBoolean("isInternetReachable", false)
              putBoolean("isConnected", false)
            }
            sendEvent(NETWORK_STATE_EVENT_NAME, result)
          } else {
            emitNetworkState()
          }
        } catch (e: SecurityException) {
          // Missing ACCESS_NETWORK_STATE permission (or runtime revocation).
          // Ensure the permission is declared in AndroidManifest.xml and
          // granted at runtime on devices that require it.
          Log.w(TAG, "expo-network could not read network state in onLost: missing ACCESS_NETWORK_STATE permission", e)
        } catch (e: Exception) {
          // The runnable may outlive the module if the React context is torn
          // down between the ConnectivityManager.NetworkCallback firing and
          // the posted runnable executing. In that case, the `connectivityManager`
          // getter throws `ReactContextLost` when it
          // attempts to resolve `appContext.reactContext`. Since
          // unregisterNetworkCallback only prevents future callbacks and
          // cannot cancel a runnable that is already in the queue, we must
          // catch teardown-time exceptions here to avoid crashing the
          // host app's main thread.
          Log.w(TAG, "expo-network dropped a network state update during teardown (the module or React context is no longer available)", e)
        }
      }
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

  /**
   * Emits the network state with a delay to prevent a race condition.
   * This delay ensures we read the actual current network state rather than stale information.
   */
  private fun asyncEmitNetworkState(delay: Int) {
    mainHandler.postDelayed({
      try {
        emitNetworkState()
      } catch (e: SecurityException) {
        Log.w(TAG, "expo-network could not read network state: missing ACCESS_NETWORK_STATE permission", e)
      } catch (e: Exception) {
        // See the matching catch in onLost for the lifecycle race this guards.
        Log.w(TAG, "expo-network dropped a delayed network state update during teardown (the module or React context is no longer available)", e)
      }
    }, delay.toLong())
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
