package expo.modules.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.Record
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.Inet4Address

private val TAG = NetworkModule::class.java.simpleName

internal const val NETWORK_STATE_EVENT_NAME = "onNetworkStateChanged"

@Record
data class NetworkState(
  val type: NetworkModule.NetworkStateType,
  val isInternetReachable: Boolean,
  val isConnected: Boolean
)

@ExpoModule("ExpoNetwork")
class NetworkModule : Module() {
  private val connectivityManager: ConnectivityManager
    get() = androidContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
  private val mainHandler = Handler(Looper.getMainLooper())
  private val DELAY_MS = 250
  private var isNetworkCallbackRegistered = false

  private val emitRunnable = Runnable { emitNetworkState() }

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
      // We still post to the main looper, so this emission is ordered with
      // the debounced one; we just skip the artificial delay.
      mainHandler.removeCallbacks(emitRunnable)
      mainHandler.post {
        try {
          val activeNetwork = connectivityManager.activeNetwork
          if (activeNetwork == null || activeNetwork == lostNetwork) {
            onNetworkStateChanged(
              NetworkState(
                type = NetworkStateType.NONE,
                isInternetReachable = false,
                isConnected = false
              )
            )
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
          // getter throws when it attempts to resolve `androidContext`. Since
          // unregisterNetworkCallback only prevents future callbacks and
          // cannot cancel a runnable that is already in the queue, we must
          // catch teardown-time exceptions here to avoid crashing the
          // host app's main thread.
          Log.w(TAG, "expo-network dropped a network state update during teardown (the module or React context is no longer available)", e)
        }
      }
    }

    override fun onCapabilitiesChanged(network: android.net.Network, networkCapabilities: NetworkCapabilities) {
      asyncEmitNetworkState(DELAY_MS)
    }
  }

  @Event(name = NETWORK_STATE_EVENT_NAME)
  private val onNetworkStateChanged = event<NetworkState>(
    onStartObserving = ::registerNetworkCallback,
    onStopObserving = ::unregisterNetworkCallback
  )

  override fun onDestroy() {
    unregisterNetworkCallback()
  }

  @JS
  suspend fun getNetworkStateAsync(): NetworkState = withContext(Dispatchers.IO) {
    fetchNetworkState()
  }

  @JS
  suspend fun getIpAddressAsync(): String = withContext(Dispatchers.IO) {
    getIpAddress()
  }

  @JS
  suspend fun isAirplaneModeEnabledAsync(): Boolean = withContext(Dispatchers.IO) {
    Settings.Global.getInt(androidContext.contentResolver, Settings.Global.AIRPLANE_MODE_ON, 0) != 0
  }

  @Synchronized
  private fun registerNetworkCallback() {
    if (isNetworkCallbackRegistered) {
      return
    }
    try {
      connectivityManager.registerDefaultNetworkCallback(networkCallback)
      isNetworkCallbackRegistered = true
    } catch (e: SecurityException) {
      Log.w(TAG, "expo-network cannot observe internet reachability: missing ACCESS_NETWORK_STATE permission", e)
    } catch (e: RuntimeException) {
      Log.e(TAG, "expo-network cannot observe internet reachability, too many callbacks registered!", e)
    }
  }

  @Synchronized
  private fun unregisterNetworkCallback() {
    mainHandler.removeCallbacks(emitRunnable)
    if (isNetworkCallbackRegistered) {
      try {
        connectivityManager.unregisterNetworkCallback(networkCallback)
      } catch (e: SecurityException) {
        Log.w(TAG, "expo-network could not unregister network callback: missing ACCESS_NETWORK_STATE permission", e)
      } catch (e: Exception) {
        Log.w(TAG, "expo-network could not unregister network callback during teardown", e)
      } finally {
        isNetworkCallbackRegistered = false
      }
    }
  }

  enum class NetworkStateType(val value: String) : Enumerable {
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
    try {
      onNetworkStateChanged(fetchNetworkState())
    } catch (e: SecurityException) {
      Log.w(TAG, "expo-network could not read network state: missing ACCESS_NETWORK_STATE permission", e)
    } catch (e: Exception) {
      // The runnable may outlive the module if the React context is torn down between the
      // ConnectivityManager callback firing and this runnable executing.
      Log.w(TAG, "expo-network dropped a delayed network state update during teardown (the module or React context is no longer available)", e)
    }
  }

  /**
   * Emits the network state with a delay to prevent a race condition.
   * This delay ensures we read the actual current network state rather than stale information.
   * Debounced: rapid successive calls collapse into a single emission.
   */
  private fun asyncEmitNetworkState(delay: Int) {
    mainHandler.removeCallbacks(emitRunnable)
    mainHandler.postDelayed(emitRunnable, delay.toLong())
  }

  private fun fetchNetworkState(): NetworkState {
    return try {
      val network = connectivityManager.activeNetwork
      val isInternetReachable = isInternetReachable(connectivityManager)

      val connectionType = if (network != null) {
        val netCapabilities = connectivityManager.getNetworkCapabilities(network)
        getConnectionType(netCapabilities)
      } else {
        null
      }

      NetworkState(
        type = connectionType ?: NetworkStateType.NONE,
        isInternetReachable = isInternetReachable,
        isConnected = connectionType != null && connectionType.isDefined
      )
    } catch (e: Exception) {
      NetworkState(
        type = NetworkStateType.UNKNOWN,
        isInternetReachable = false,
        isConnected = false
      )
    }
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

  private fun getIpAddress(): String {
    val network = connectivityManager.activeNetwork ?: return "0.0.0.0"
    val linkProperties = connectivityManager.getLinkProperties(network) ?: return "0.0.0.0"
    val addresses = linkProperties.linkAddresses
      .map { it.address }
      .filterIsInstance<Inet4Address>()
      .filterNot { it.isLoopbackAddress || it.isMulticastAddress || it.isAnyLocalAddress }

    val address = addresses
      .firstOrNull { !it.isLinkLocalAddress }
      ?: addresses.firstOrNull()

    return address?.hostAddress ?: "0.0.0.0"
  }
}
